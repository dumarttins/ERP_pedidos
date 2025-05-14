<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'coupon_id',
        'status',
        'subtotal',
        'discount',
        'shipping',
        'total',
        'customer_name',
        'customer_email',
        'shipping_address',
        'shipping_city',
        'shipping_state',
        'shipping_zipcode',
        'shipping_country',
        'notes',
    ];

    /**
     * Boot function do modelo
     */
    protected static function boot()
    {
        parent::boot();

        // Gerar automaticamente um número de pedido único
        static::creating(function ($order) {
            $order->order_number = 'ORD-' . strtoupper(Str::random(10));
        });
    }

    /**
     * Relacionamento com o cupom
     */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Relacionamento com os itens do pedido
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Calcula o valor de frete com base no subtotal
     */
    public static function calculateShipping(float $subtotal): float
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
     * Calcula ou recalcula os totais do pedido
     */
    public function calculateTotals(): void
    {
        // Calcular o subtotal baseado nos itens
        $this->subtotal = $this->items->sum('total');
        
        // Calcular o desconto se houver cupom
        $this->discount = $this->coupon ? $this->coupon->calculateDiscount($this->subtotal) : 0;
        
        // Calcular o frete
        $this->shipping = self::calculateShipping($this->subtotal);
        
        // Calcular o total final
        $this->total = $this->subtotal - $this->discount + $this->shipping;
    }
    
    /**
     * Verifica se o pedido pode ser cancelado
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'processing']);
    }
    
    /**
     * Cancela o pedido e restaura o estoque
     */
    public function cancel(): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }
        
        $this->status = 'cancelled';
        
        // Restaurar o estoque
        foreach ($this->items as $item) {
            if ($item->product_variation_id) {
                $stock = Stock::where('product_variation_id', $item->product_variation_id)->first();
            } else {
                $stock = Stock::where('product_id', $item->product_id)
                    ->whereNull('product_variation_id')
                    ->first();
            }
            
            if ($stock) {
                $stock->increaseStock($item->quantity);
            }
        }
        
        // Se houver cupom, reduzir o contador de uso
        if ($this->coupon_id) {
            $coupon = $this->coupon;
            $coupon->used_times = max(0, $coupon->used_times - 1);
            $coupon->save();
        }
        
        return $this->save();
    }
}