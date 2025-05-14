<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Stock;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use App\Mail\OrderConfirmed;

class CheckoutController extends Controller
{
    /**
     * Processa o checkout e cria o pedido
     */
    public function process(Request $request)
    {
        // Validação dos dados do cliente
        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'shipping_address' => 'required|string|max:255',
            'shipping_city' => 'required|string|max:100',
            'shipping_state' => 'required|string|max:100',
            'shipping_zipcode' => 'required|string|max:20',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $cart = Session::get('cart');
        
        // Verifica se o carrinho está vazio
        if (!$cart || count($cart['items']) == 0) {
            return response()->json([
                'success' => false,
                'message' => 'Seu carrinho está vazio! Adicione produtos antes de finalizar a compra.'
            ], 400);
        }
        
        // Inicia uma transação para garantir a integridade dos dados
        DB::beginTransaction();
        
        try {
            // Cria o pedido
            $order = new Order();
            $order->subtotal = $cart['subtotal'];
            $order->discount = $cart['discount'];
            $order->shipping = $cart['shipping'];
            $order->total = $cart['total'];
            $order->status = 'pending';
            
            // Dados do cliente
            $order->customer_name = $request->customer_name;
            $order->customer_email = $request->customer_email;
            $order->shipping_address = $request->shipping_address;
            $order->shipping_city = $request->shipping_city;
            $order->shipping_state = $request->shipping_state;
            $order->shipping_zipcode = $request->shipping_zipcode;
            $order->shipping_country = 'Brasil';
            $order->notes = $request->notes;
            
            // Se tiver cupom, associa ao pedido
            if ($cart['coupon_id']) {
                $coupon = Coupon::find($cart['coupon_id']);
                if ($coupon && $coupon->isValid($cart['subtotal'])) {
                    $order->coupon_id = $coupon->id;
                    // Incrementa o uso do cupom
                    $coupon->incrementUsage();
                }
            }
            
            $order->save();
            
            // Adiciona os itens ao pedido
            foreach ($cart['items'] as $item) {
                $orderItem = new OrderItem();
                $orderItem->order_id = $order->id;
                $orderItem->product_id = $item['product_id'];
                $orderItem->product_variation_id = $item['product_variation_id'];
                $orderItem->quantity = $item['quantity'];
                $orderItem->price = $item['price'];
                $orderItem->total = $item['price'] * $item['quantity'];
                $orderItem->save();
                
                // Reduz o estoque
                if ($item['product_variation_id']) {
                    $stock = Stock::where('product_id', $item['product_id'])
                        ->where('product_variation_id', $item['product_variation_id'])
                        ->first();
                } else {
                    $stock = Stock::where('product_id', $item['product_id'])
                        ->whereNull('product_variation_id')
                        ->first();
                }
                
                if ($stock) {
                    // Se não conseguir diminuir o estoque, desfaz a transação
                    if (!$stock->decreaseStock($item['quantity'])) {
                        throw new \Exception('Estoque insuficiente para o produto: ' . $item['name']);
                    }
                }
            }
            
            // Envia e-mail de confirmação
            try {
                Mail::to($order->customer_email)
                    ->send(new OrderConfirmed($order));
            } catch (\Exception $e) {
                // Registra o erro de envio de e-mail, mas não impede a finalização do pedido
                Log::error('Erro ao enviar e-mail: ' . $e->getMessage());
            }
            
            // Limpa o carrinho após a finalização
            Session::forget('cart');
            
            // Confirma a transação
            DB::commit();
            
            // Retorna o pedido criado
            return response()->json([
                'success' => true,
                'message' => 'Pedido realizado com sucesso!',
                'data' => [
                    'order' => $order,
                    'order_number' => $order->order_number
                ]
            ], 201);
            
        } catch (\Exception $e) {
            // Se algo der errado, desfaz a transação
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao processar o pedido',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Retorna os detalhes de um pedido finalizado
     */
    public function getOrderDetails(Order $order)
    {
        $order->load('items.product', 'items.productVariation', 'coupon');
        
        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }
    
    /**
     * Lista todos os pedidos (para admin)
     */
    public function listOrders(Request $request)
    {
        $query = Order::with(['items', 'coupon']);
        
        // Filtro por status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Ordenação
        if ($request->has('sort_by')) {
            $sortField = $request->sort_by;
            $sortDirection = $request->sort_dir ?? 'desc';
            
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }
        
        // Paginação
        $perPage = $request->per_page ?? 15;
        $orders = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }
    
    /**
     * Exibe detalhes de um pedido específico (para admin)
     */
    public function showOrder(Order $order)
    {
        $order->load(['items.product', 'items.productVariation', 'coupon']);
        
        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }
    
    /**
     * Atualiza o status de um pedido (para admin)
     */
    public function updateOrderStatus(Request $request, Order $order)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:pending,processing,completed,shipped,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $newStatus = $request->status;
        $oldStatus = $order->status;
        
        // Se estiver cancelando o pedido
        if ($newStatus == 'cancelled' && $oldStatus != 'cancelled') {
            if (!$order->canBeCancelled()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este pedido não pode ser cancelado.'
                ], 400);
            }
            
            // Cancela o pedido (restaura estoque e ajusta cupom)
            $order->cancel();
        } else {
            // Apenas atualiza o status
            $order->status = $newStatus;
            $order->save();
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Status do pedido atualizado com sucesso',
            'data' => $order
        ]);
    }
    
    /**
     * Consulta CEP via API externa
     */
    public function fetchAddress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'zipcode' => 'required|string|min:8|max:9',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $zipcode = preg_replace('/[^0-9]/', '', $request->zipcode);
        
        if (strlen($zipcode) !== 8) {
            return response()->json([
                'success' => false,
                'message' => 'CEP inválido'
            ], 400);
        }
        
        try {
            // Consulta a API ViaCEP
            $response = file_get_contents('https://viacep.com.br/ws/'.$zipcode.'/json/');
            $data = json_decode($response);
            
            // Verifica se houve erro na consulta
            if (isset($data->erro) && $data->erro) {
                return response()->json([
                    'success' => false,
                    'message' => 'CEP não encontrado'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'address' => $data->logradouro,
                    'neighborhood' => $data->bairro,
                    'city' => $data->localidade,
                    'state' => $data->uf,
                    'zipcode' => $zipcode
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao consultar CEP',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}