<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Processa webhooks para atualizar status dos pedidos
     */
    public function handleOrderStatus(Request $request)
    {
        // Validação básica dos dados recebidos
        if (!$request->has('order_id') || !$request->has('status')) {
            Log::error('Webhook: Dados insuficientes', $request->all());
            return response()->json(['error' => 'Dados insuficientes'], 400);
        }

        $orderId = $request->input('order_id');
        $status = $request->input('status');

        // Busca o pedido
        $order = Order::find($orderId);

        if (!$order) {
            Log::error('Webhook: Pedido não encontrado', ['order_id' => $orderId]);
            return response()->json(['error' => 'Pedido não encontrado'], 404);
        }

        try {
            // Trata cada status possível
            switch ($status) {
                case 'cancelled':
                    // Se for cancelado, executa a rotina de cancelamento
                    if ($order->cancel()) {
                        Log::info('Webhook: Pedido cancelado com sucesso', ['order_id' => $orderId]);
                        return response()->json(['message' => 'Pedido cancelado com sucesso']);
                    } else {
                        Log::error('Webhook: Erro ao cancelar pedido', ['order_id' => $orderId]);
                        return response()->json(['error' => 'Erro ao cancelar pedido'], 500);
                    }
                    break;

                case 'processing':
                case 'completed':
                case 'shipped':
                case 'refunded':
                    // Apenas atualiza o status
                    $order->status = $status;
                    $order->save();

                    Log::info('Webhook: Status do pedido atualizado', [
                        'order_id' => $orderId,
                        'status' => $status
                    ]);

                    return response()->json(['message' => 'Status do pedido atualizado']);
                    break;

                default:
                    Log::warning('Webhook: Status desconhecido', [
                        'order_id' => $orderId,
                        'status' => $status
                    ]);
                    return response()->json(['error' => 'Status desconhecido'], 400);
            }
        } catch (\Exception $e) {
            Log::error('Webhook: Erro ao processar', [
                'order_id' => $orderId,
                'status' => $status,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Erro interno: ' . $e->getMessage()], 500);
        }
    }
}