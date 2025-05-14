<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'description',
        'has_variations',
        'active'
    ];

    /**
     * Relacionamento com as variações do produto
     */
    public function variations(): HasMany
    {
        return $this->hasMany(ProductVariation::class);
    }

    /**
     * Relacionamento com os estoques do produto
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    /**
     * Método para verificar se o produto está disponível (tem estoque)
     */
    public function isAvailable(): bool
    {
        if ($this->has_variations) {
            // Para produtos com variações, verificamos se alguma variação tem estoque
            return $this->variations()
                ->join('stocks', 'product_variations.id', '=', 'stocks.product_variation_id')
                ->where('stocks.quantity', '>', 0)
                ->exists();
        }
        
        // Para produtos sem variações, verificamos o estoque diretamente
        return $this->stocks()->where('quantity', '>', 0)->exists();
    }

    /**
     * Método para obter o estoque total do produto
     */
    public function totalStock(): int
    {
        if ($this->has_variations) {
            return $this->stocks()
                ->whereNotNull('product_variation_id')
                ->sum('quantity');
        }
        
        return $this->stocks()
            ->whereNull('product_variation_id')
            ->sum('quantity');
    }
}