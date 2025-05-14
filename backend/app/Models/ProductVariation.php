<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductVariation extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'name',
        'price_adjustment',
        'active'
    ];

    /**
     * Relacionamento com o produto
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relacionamento com o estoque
     */
    public function stock(): HasOne
    {
        return $this->hasOne(Stock::class);
    }

    /**
     * Método para calcular o preço final da variação
     */
    public function getFinalPrice(): float
    {
        return $this->product->price + $this->price_adjustment;
    }

    /**
     * Método para verificar se a variação está disponível (tem estoque)
     */
    public function isAvailable(): bool
    {
        return $this->stock && $this->stock->quantity > 0;
    }
}