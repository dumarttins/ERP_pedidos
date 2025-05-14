<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_value',
        'max_uses',
        'used_times',
        'active',
        'valid_from',
        'valid_until'
    ];

    protected $casts = [
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    /**
     * Relacionamento com os pedidos
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Verifica se o cupom é válido
     */
    public function isValid(float $cartTotal = 0): bool
    {
        // Verifica se o cupom está ativo
        if (!$this->active) {
            return false;
        }

        // Verifica se o cupom está dentro do período de validade
        $now = Carbon::now();
        if ($this->valid_from && $now->lt($this->valid_from)) {
            return false;
        }
        if ($this->valid_until && $now->gt($this->valid_until)) {
            return false;
        }

        // Verifica se o cupom atingiu o limite de usos
        if ($this->max_uses && $this->used_times >= $this->max_uses) {
            return false;
        }

        // Verifica se o carrinho atinge o valor mínimo
        if ($this->min_value && $cartTotal < $this->min_value) {
            return false;
        }

        return true;
    }

    /**
     * Calcula o valor do desconto
     */
    public function calculateDiscount(float $cartTotal): float
    {
        if (!$this->isValid($cartTotal)) {
            return 0;
        }

        if ($this->type === 'percentage') {
            return $cartTotal * ($this->value / 100);
        }

        // Para desconto de valor fixo, nunca deve ser maior que o total
        return min($this->value, $cartTotal);
    }

    /**
     * Incrementa o contador de uso do cupom
     */
    public function incrementUsage(): bool
    {
        $this->used_times++;
        return $this->save();
    }
}