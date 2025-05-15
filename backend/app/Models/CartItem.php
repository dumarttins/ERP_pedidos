<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'cart_id',
        'product_id',
        'product_variation_id',
        'quantity',
        'price',
        'name',
        'variation_name'
    ];
    
    /**
     * Relacionamento com o carrinho
     */
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }
    
    /**
     * Relacionamento com o produto
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    
    /**
     * Relacionamento com a variação do produto
     */
    public function variation()
    {
        return $this->belongsTo(ProductVariation::class, 'product_variation_id');
    }
}
