<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CouponController extends Controller
{
    /**
     * Lista todos os cupons
     */
    public function index()
    {
        $coupons = Coupon::all();
        
        return response()->json([
            'success' => true,
            'data' => $coupons
        ]);
    }

    /**
     * Armazena um novo cupom
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:20|unique:coupons,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_value' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        // Valida regras específicas para cada tipo de cupom
        if ($request->type == 'percentage' && $request->value > 100) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => [
                    'value' => ['Porcentagem não pode ser maior que 100%']
                ]
            ], 422);
        }

        // Cria o cupom
        $coupon = Coupon::create([
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'min_value' => $request->min_value,
            'max_uses' => $request->max_uses,
            'active' => $request->has('active'),
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cupom criado com sucesso',
            'data' => $coupon
        ], 201);
    }

    /**
     * Exibe um cupom específico
     */
    public function show(Coupon $coupon)
    {
        return response()->json([
            'success' => true,
            'data' => $coupon
        ]);
    }

    /**
     * Atualiza um cupom
     */
    public function update(Request $request, Coupon $coupon)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:20|unique:coupons,code,' . $coupon->id,
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_value' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $validator->errors()
            ], 422);
        }

        // Valida regras específicas para cada tipo de cupom
        if ($request->type == 'percentage' && $request->value > 100) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => [
                    'value' => ['Porcentagem não pode ser maior que 100%']
                ]
            ], 422);
        }

        // Atualiza o cupom
        $coupon->update([
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'min_value' => $request->min_value,
            'max_uses' => $request->max_uses,
            'active' => $request->has('active'),
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cupom atualizado com sucesso',
            'data' => $coupon
        ]);
    }

    /**
     * Remove um cupom
     */
    public function destroy(Coupon $coupon)
    {
        try {
            $coupon->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Cupom excluído com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir cupom',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}