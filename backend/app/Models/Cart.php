<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'cart_id',
        'user_id',
        'coupon_code',
        'coupon_id',
        'subtotal',
        'discount',
        'shipping',
        'total'
    ];
    
    /**
     * Relacionamento com os itens do carrinho
     */
    public function items()
    {
        return $this->hasMany(CartItem::class);
    }
    
    /**
     * Relacionamento com o cupom aplicado
     */
    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }
    
    /**
     * Relacionamento com o usuário
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Recalcula os totais do carrinho
     */
    public function recalculate()
    {
        // Calcula o subtotal
        $subtotal = $this->items->sum(function ($item) {
            return $item->price * $item->quantity;
        });
        
        $this->subtotal = $subtotal;
        
        // Calcula o desconto se houver cupom
        if ($this->coupon_id) {
            $coupon = $this->coupon;
            if ($coupon && $coupon->isValid($subtotal)) {
                $this->discount = $coupon->calculateDiscount($subtotal);
            } else {
                $this->coupon_code = null;
                $this->coupon_id = null;
                $this->discount = 0;
            }
        } else {
            $this->discount = 0;
        }
        
        // Calcula o frete
        $this->shipping = $this->calculateShipping($subtotal);
        
        // Calcula o total
        $this->total = $subtotal - $this->discount + $this->shipping;
        
        return $this;
    }
    
    /**
     * Calcula o frete com base no subtotal
     */
    protected function calculateShipping($subtotal)
    {
        if ($subtotal >= 200.00) {
            return 0; // Frete grátis
        } elseif ($subtotal >= 52.00 && $subtotal <= 166.59) {
            return 15.00;
        } else {
            return 20.00;
        }
    }
    
    /**
     * Converte o carrinho para o formato de array
     */
    public function toArray()
    {
        $array = parent::toArray();
        $array['items'] = $this->items->toArray();
        return $array;
    }
}
