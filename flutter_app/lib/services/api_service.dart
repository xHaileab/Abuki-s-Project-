import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_env.dart';
import '../models/ad.dart';
import '../models/app_config.dart';
import '../models/order_models.dart';
import '../models/product.dart';

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Uri _uri(String path) => Uri.parse('${AppEnv.backendBaseUrl}$path');

  Future<List<AdBanner>> fetchAds() async {
    final response = await _client.get(_uri('/api/ads'));
    _guard(response, 'Failed to load ads');
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final data = (decoded['data'] as List<dynamic>? ?? <dynamic>[])
        .map((item) => AdBanner.fromJson(item as Map<String, dynamic>))
        .toList();
    return data;
  }

  Future<List<Product>> fetchProducts() async {
    final response = await _client.get(_uri('/api/products'));
    _guard(response, 'Failed to load products');
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return (decoded['data'] as List<dynamic>? ?? <dynamic>[])
        .map((item) => Product.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<AppConfig> fetchConfig() async {
    final response = await _client.get(_uri('/api/config'));
    _guard(response, 'Failed to load checkout config');
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return AppConfig.fromJson(decoded['data'] as Map<String, dynamic>);
  }

  Future<OrderReceipt> createOrder({
    required List<OrderLine> items,
    required double total,
    String? customerName,
    String? customerPhone,
    String? address,
    String? addressNote,
  }) async {
    final body = <String, dynamic>{
      'items': items.map((e) => e.toJson()).toList(),
      'total': total,
    };
    if (customerName != null && customerName.isNotEmpty) {
      body['customerName'] = customerName;
    }
    if (customerPhone != null && customerPhone.isNotEmpty) {
      body['customerPhone'] = customerPhone;
    }
    if (address != null && address.isNotEmpty) body['address'] = address;
    if (addressNote != null && addressNote.isNotEmpty) {
      body['addressNote'] = addressNote;
    }

    final response = await _client.post(
      _uri('/api/orders'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    _guard(response, 'Failed to submit order');
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return OrderReceipt.fromJson(decoded['data'] as Map<String, dynamic>);
  }

  void _guard(http.Response response, String fallback) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    String message = fallback;
    try {
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      message = (decoded['error'] ?? fallback).toString();
    } catch (_) {
      // fallback retained
    }
    throw Exception(message);
  }
}
