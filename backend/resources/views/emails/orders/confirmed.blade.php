<!DOCTYPE html>
<html>
<head>
    <title>Pedido Confirmado</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 20px;
            background-color: #f5f5f5;
            margin-bottom: 20px;
        }
        .order-number {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f5f5f5;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Pedido Confirmado</h1>
        <p class="order-number">Pedido #{{ $order->order_number }}</p>
    </div>
    
    <div class="section">
        <p>Olá {{ $order->customer_name }},</p>
        <p>Seu pedido foi recebido e está sendo processado. Abaixo estão os detalhes do seu pedido:</p>
    </div>
    
    <div class="section">
        <h2 class="section-title">Detalhes do Pedido</h2>
        <p><strong>Número do Pedido:</strong> #{{ $order->order_number }}</p>
        <p><strong>Data:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</p>
        <p><strong>Status:</strong> {{ ucfirst($order->status) }}</p>
    </div>
    
    <div class="section">
        <h2 class="section-title">Itens do Pedido</h2>
        <table>
            <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Preço</th>
                <th>Total</th>
            </tr>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item->product->name }} 
                    @if($item->productVariation)
                    ({{ $item->productVariation->name }})
                    @endif
                </td>
                <td>{{ $item->quantity }}</td>
                <td>R$ {{ number_format($item->price, 2, ',', '.') }}</td>
                <td>R$ {{ number_format($item->total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </table>
    </div>
    
    <div class="section">
        <h2 class="section-title">Resumo</h2>
        <p><strong>Subtotal:</strong> R$ {{ number_format($order->subtotal, 2, ',', '.') }}</p>
        @if($order->discount > 0)
        <p><strong>Desconto:</strong> R$ {{ number_format($order->discount, 2, ',', '.') }}</p>
        @endif
        <p><strong>Frete:</strong> R$ {{ number_format($order->shipping, 2, ',', '.') }}</p>
        <p><strong>Total:</strong> R$ {{ number_format($order->total, 2, ',', '.') }}</p>
    </div>
    
    <div class="section">
        <h2 class="section-title">Endereço de Entrega</h2>
        <p>{{ $order->shipping_address }}</p>
        <p>{{ $order->shipping_city }} - {{ $order->shipping_state }}, {{ $order->shipping_zipcode }}</p>
        <p>{{ $order->shipping_country }}</p>
    </div>
    
    <div class="footer">
        <p>Obrigado por comprar conosco!</p>
        <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
</body>
</html> 