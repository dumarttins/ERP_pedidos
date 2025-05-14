<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_variation_id',
        'quantity',
        'price',
        'total'
    ];

    /**
     * Relacionamento com o pedido
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relacionamento com o produto
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relacionamento com a variação do produto
     */
    public function productVariation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class);
    }

    /**
     * Calcula o total do item baseado na quantidade e preço
     */
    public function calculateTotal(): float
    {
        return $this->quantity * $this->price;
    }

    /**
     * Boot function do modelo
     */
    protected static function boot()
    {
        parent::boot();

        // Calcular o total automaticamente antes de salvar
        static::saving(function ($item) {
            $item->total = $item->calculateTotal();
        });
    }
}