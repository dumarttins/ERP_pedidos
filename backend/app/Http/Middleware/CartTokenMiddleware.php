<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CartTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Verificar se o cart_token já está no cookie
        if (!$request->cookie('cart_token')) {
            // Criar um novo token
            $cartToken = md5(uniqid(rand(), true));
            
            // Log para debug
            Log::info('Creating new cart token: ' . $cartToken);
            
            // Continuar com a requisição
            $response = $next($request);
            
            // Adicionar o cookie na resposta
            return $response->cookie('cart_token', $cartToken, 60 * 24 * 30); // 30 dias
        }
        
        // Se o cart_token já existe, continuar normalmente
        Log::info('Using existing cart token: ' . $request->cookie('cart_token'));
        return $next($request);
    }
} 