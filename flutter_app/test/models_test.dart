import 'package:flutter_test/flutter_test.dart';

import 'package:dream/models/app_config.dart';
import 'package:dream/models/order_models.dart';

void main() {
  test('OrderLine serializes the payload expected by the API', () {
    final line = OrderLine(
      productId: 'prd-onion',
      name: 'Onion',
      price: 50,
      quantity: 2,
    );

    expect(line.toJson(), <String, dynamic>{
      'productId': 'prd-onion',
      'name': 'Onion',
      'price': 50,
      'quantity': 2,
    });
  });

  test('OrderReceipt parses the backend response shape', () {
    final receipt = OrderReceipt.fromJson(<String, dynamic>{
      'id': 'ORD-12345678',
      'total': 100,
      'createdAt': '2026-05-20T12:30:00.000Z',
    });

    expect(receipt.id, 'ORD-12345678');
    expect(receipt.total, 100);
    expect(
      receipt.createdAt.toUtc().toIso8601String(),
      '2026-05-20T12:30:00.000Z',
    );
  });

  test('AppConfig uses empty strings when optional config is missing', () {
    final config = AppConfig.fromJson(<String, dynamic>{});

    expect(config.adminPhone, '');
    expect(config.paymentInstructions, '');
    expect(config.telebirrMerchantName, '');
    expect(config.telebirrPhone, '');
    expect(config.telebirrQrImageUrl, '');
  });

  test('AppConfig parses Telebirr payment config', () {
    final config = AppConfig.fromJson(<String, dynamic>{
      'adminPhone': '+251911223344',
      'paymentInstructions': 'Scan and pay.',
      'telebirrMerchantName': 'Dream Direct Orders',
      'telebirrPhone': '+251911223344',
      'telebirrQrImageUrl': 'https://example.com/qr.png',
    });

    expect(config.telebirrMerchantName, 'Dream Direct Orders');
    expect(config.telebirrPhone, '+251911223344');
    expect(config.telebirrQrImageUrl, 'https://example.com/qr.png');
  });
}
