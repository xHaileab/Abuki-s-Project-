import 'package:flutter/foundation.dart';

import '../models/ad.dart';
import '../models/app_config.dart';
import '../models/order_models.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class OrderProvider extends ChangeNotifier {
  OrderProvider({required ApiService apiService}) : _apiService = apiService;

  final ApiService _apiService;

  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  List<AdBanner> _ads = <AdBanner>[];
  List<Product> _products = <Product>[];
  AppConfig? _config;
  final Map<String, int> _quantities = <String, int>{};

  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  List<AdBanner> get ads => List<AdBanner>.unmodifiable(_ads);
  List<Product> get products => List<Product>.unmodifiable(_products);
  AppConfig? get config => _config;

  Future<void> loadInitialData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final futures = await Future.wait<Object>(<Future<Object>>[
        _apiService.fetchAds(),
        _apiService.fetchProducts(),
        _apiService.fetchConfig(),
      ]);

      _ads = futures[0] as List<AdBanner>;
      _products = futures[1] as List<Product>;
      _config = futures[2] as AppConfig;

      for (final product in _products) {
        _quantities.putIfAbsent(product.id, () => 0);
      }
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  int quantityFor(String productId) => _quantities[productId] ?? 0;

  void increment(String productId) {
    _quantities.update(productId, (value) => value + 1, ifAbsent: () => 1);
    notifyListeners();
  }

  void decrement(String productId) {
    final current = quantityFor(productId);
    if (current <= 0) {
      return;
    }
    _quantities[productId] = current - 1;
    notifyListeners();
  }

  List<OrderLine> get selectedLines {
    final selected = <OrderLine>[];
    for (final product in _products) {
      final quantity = quantityFor(product.id);
      if (quantity <= 0) {
        continue;
      }
      selected.add(
        OrderLine(
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
        ),
      );
    }
    return selected;
  }

  double get total {
    double value = 0;
    for (final product in _products) {
      value += product.price * quantityFor(product.id);
    }
    return value;
  }

  bool get hasSelectedItems => selectedLines.isNotEmpty;

  Future<OrderReceipt?> submitOrder({
    String? customerName,
    String? customerPhone,
    String? address,
    String? addressNote,
  }) async {
    if (!hasSelectedItems) {
      _errorMessage = 'Please select at least one item.';
      notifyListeners();
      return null;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final receipt = await _apiService.createOrder(
        items: selectedLines,
        total: total,
        customerName: customerName,
        customerPhone: customerPhone,
        address: address,
        addressNote: addressNote,
      );
      return receipt;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      return null;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  void clearSelection() {
    for (final key in _quantities.keys) {
      _quantities[key] = 0;
    }
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
