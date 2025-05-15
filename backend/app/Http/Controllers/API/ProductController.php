<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * Lista todos os produtos
     */
    public function index(Request $request)
    {
        $query = Product::with(['variations', 'stocks']);
        
        // Filtragem por disponibilidade
        if ($request->has('available') && $request->available === 'true') {
            $query->whereHas('stocks', function ($q) {
                $q->where('quantity', '>', 0);
            });
        }
        
        // Ordenação
        if ($request->has('sort_by')) {
            $sortField = $request->sort_by;
            $sortDirection = $request->sort_dir ?? 'asc';
            
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }
        
        $products = $query->get();
        
        // Adiciona metadados úteis para cada produto
        $products->each(function ($product) {
            $product->is_available = $product->isAvailable();
            $product->total_stock = $product->totalStock();
        });
        
        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Exibe um produto específico
     */
    public function show(Product $product)
    {
        $product->load(['variations.stock', 'stocks']);
        
        // Adiciona metadados úteis para o produto
        $product->is_available = $product->isAvailable();
        $product->total_stock = $product->totalStock();
        
        // Para cada variação, adicione informações de disponibilidade
        if ($product->variations) {
            $product->variations->each(function ($variation) {
                $variation->is_available = $variation->isAvailable();
                $variation->final_price = $variation->getFinalPrice();
            });
        }
        
        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Armazena um novo produto
     */
    public function store(Request $request)
    {
        // Validação dos dados
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'has_variations' => 'boolean',
            'stock_quantity' => 'required_without:variations|integer|min:0',
            'variations' => 'required_if:has_variations,true|array',
            'variations.*.name' => 'required_with:variations|string|max:255',
            'variations.*.price_adjustment' => 'required_with:variations|numeric',
            'variations.*.stock_quantity' => 'required_with:variations|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        // Inicia uma transação para garantir a integridade dos dados
        DB::beginTransaction();

        try {
            // Cria o produto
            $product = Product::create([
                'name' => $request->name,
                'price' => $request->price,
                'description' => $request->description,
                'has_variations' => $request->input('has_variations', false),
                'active' => true
            ]);

            // Se o produto não tem variações, cria um registro de estoque simples
            if (!$request->input('has_variations', false)) {
                Stock::create([
                    'product_id' => $product->id,
                    'quantity' => $request->stock_quantity,
                ]);
            } else {
                // Caso contrário, cria as variações e seus estoques
                foreach ($request->variations as $variationData) {
                    $variation = ProductVariation::create([
                        'product_id' => $product->id,
                        'name' => $variationData['name'],
                        'price_adjustment' => $variationData['price_adjustment'],
                        'active' => true
                    ]);

                    Stock::create([
                        'product_id' => $product->id,
                        'product_variation_id' => $variation->id,
                        'quantity' => $variationData['stock_quantity'],
                    ]);
                }
            }

            DB::commit();

            // Carrega as relações criadas
            $product->load(['variations.stock', 'stocks']);

            return response()->json([
                'success' => true,
                'message' => 'Produto criado com sucesso',
                'data' => $product
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualiza um produto
     */
    public function update(Request $request, Product $product)
    {
        // Validação dos dados
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'has_variations' => 'boolean',
            'active' => 'boolean',
            'stock_quantity' => 'required_without:variations|integer|min:0',
            'variations' => 'required_if:has_variations,true|array',
            'variations.*.id' => 'nullable|exists:product_variations,id',
            'variations.*.name' => 'required_with:variations|string|max:255',
            'variations.*.price_adjustment' => 'required_with:variations|numeric',
            'variations.*.stock_quantity' => 'required_with:variations|integer|min:0',
            'variations.*.active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        // Inicia uma transação para garantir a integridade dos dados
        DB::beginTransaction();

        try {
            // Atualiza o produto
            $product->update([
                'name' => $request->name,
                'price' => $request->price,
                'description' => $request->description,
                'has_variations' => $request->input('has_variations', false),
                'active' => $request->input('active', true)
            ]);

            // Se o produto não tem variações, atualiza o estoque simples
            if (!$request->input('has_variations', false)) {
                $stock = Stock::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'product_variation_id' => null,
                    ],
                    [
                        'quantity' => $request->stock_quantity,
                    ]
                );
                
                // Remove qualquer variação existente (caso o produto tenha mudado de tipo)
                $product->variations()->delete();
            } else {
                // Remove qualquer estoque simples (caso o produto tenha mudado de tipo)
                Stock::where('product_id', $product->id)
                    ->whereNull('product_variation_id')
                    ->delete();
                
                // Obtém os IDs existentes para identificar variações removidas
                $existingVariationIds = $product->variations->pluck('id')->toArray();
                $updatedVariationIds = collect($request->variations)
                    ->pluck('id')
                    ->filter()
                    ->toArray();
                
                // Remove variações que não estão mais presentes
                $removedVariationIds = array_diff($existingVariationIds, $updatedVariationIds);
                if (count($removedVariationIds) > 0) {
                    ProductVariation::whereIn('id', $removedVariationIds)->delete();
                }
                
                // Atualiza ou cria as variações
                foreach ($request->variations as $variationData) {
                    if (!empty($variationData['id'])) {
                        // Atualiza variação existente
                        $variation = ProductVariation::find($variationData['id']);
                        $variation->update([
                            'name' => $variationData['name'],
                            'price_adjustment' => $variationData['price_adjustment'],
                            'active' => isset($variationData['active']) ? $variationData['active'] : true
                        ]);
                        
                        // Atualiza o estoque
                        Stock::updateOrCreate(
                            [
                                'product_id' => $product->id,
                                'product_variation_id' => $variation->id,
                            ],
                            [
                                'quantity' => $variationData['stock_quantity'],
                            ]
                        );
                    } else {
                        // Cria nova variação
                        $variation = ProductVariation::create([
                            'product_id' => $product->id,
                            'name' => $variationData['name'],
                            'price_adjustment' => $variationData['price_adjustment'],
                            'active' => isset($variationData['active']) ? $variationData['active'] : true
                        ]);
                        
                        // Cria estoque para a nova variação
                        Stock::create([
                            'product_id' => $product->id,
                            'product_variation_id' => $variation->id,
                            'quantity' => $variationData['stock_quantity'],
                        ]);
                    }
                }
            }

            DB::commit();

            // Carrega as relações atualizadas
            $product->load(['variations.stock', 'stocks']);

            return response()->json([
                'success' => true,
                'message' => 'Produto atualizado com sucesso',
                'data' => $product
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove um produto
     */
    public function destroy(Product $product)
    {
        try {
            // A exclusão em cascata irá remover variações e estoques automaticamente
            // devido às restrições de chave estrangeira definidas nas migrações
            $product->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Produto excluído com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}