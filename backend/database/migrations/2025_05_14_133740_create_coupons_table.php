<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['percentage', 'fixed']);
            $table->decimal('value', 10, 2); // Valor do desconto (ou porcentagem)
            $table->decimal('min_value', 10, 2)->nullable(); // Valor mínimo do carrinho
            $table->integer('max_uses')->nullable(); // Máximo de usos
            $table->integer('used_times')->default(0); // Controle de quantas vezes o cupom foi usado
            $table->boolean('active')->default(true);
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};