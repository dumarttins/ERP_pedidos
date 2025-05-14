<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'product_variation_id',
        'quantity'
    ];

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
     * Método para reduzir o estoque
     */
    public function decreaseStock(int $quantity): bool
    {
        if ($this->quantity < $quantity) {
            return false;
        }

        $this->quantity -= $quantity;
        return $this->save();
    }

    /**
     * Método para aumentar o estoque
     */
    public function increaseStock(int $quantity): bool
    {
        $this->quantity += $quantity;
        return $this->save();
    }
}