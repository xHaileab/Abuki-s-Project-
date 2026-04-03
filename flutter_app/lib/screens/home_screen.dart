import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/order_provider.dart';
import '../widgets/ad_carousel.dart';
import '../widgets/product_row.dart';
import 'checkout_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: <Widget>[
          Positioned(
            right: -35,
            top: 30,
            bottom: 0,
            child: Opacity(
              opacity: 0.26,
              child: Image.asset('assets/images/motif.jpg'),
            ),
          ),
          SafeArea(
            child: Consumer<OrderProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading && provider.products.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                return RefreshIndicator(
                  onRefresh: provider.loadInitialData,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
                    children: <Widget>[
                      const SizedBox(height: 4),
                      AdCarousel(ads: provider.ads),
                      const SizedBox(height: 18),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              const Row(
                                children: <Widget>[
                                  Icon(
                                    Icons.shopping_basket_outlined,
                                    color: Color(0xFF0B7B78),
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Order Details',
                                    style: TextStyle(
                                      fontSize: 31,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF0D6866),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              if (provider.errorMessage != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Text(
                                    provider.errorMessage!,
                                    style: const TextStyle(
                                      color: Colors.redAccent,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ...provider.products.map(
                                (product) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: ProductRow(
                                    product: product,
                                    quantity: provider.quantityFor(product.id),
                                    onDecrement: () =>
                                        provider.decrement(product.id),
                                    onIncrement: () =>
                                        provider.increment(product.id),
                                  ),
                                ),
                              ),
                              const Divider(height: 28),
                              Row(
                                children: <Widget>[
                                  const Expanded(
                                    child: Text(
                                      'Total Amount',
                                      style: TextStyle(
                                        fontSize: 18,
                                        color: Colors.black54,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  Flexible(
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        '${provider.total.toStringAsFixed(2)} ETB',
                                        style: const TextStyle(
                                          fontSize: 32,
                                          color: Color(0xFF0A3534),
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 58,
                        child: ElevatedButton(
                          onPressed: provider.isSubmitting
                              ? null
                              : () => _onBuyNow(context, provider),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFF9800),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            textStyle: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          child: provider.isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Buy Now'),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _onBuyNow(BuildContext context, OrderProvider provider) async {
    provider.clearError();
    final selected = provider.selectedLines;
    if (selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one item.')),
      );
      return;
    }

    final total = provider.total;
    final config = provider.config;
    if (config == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Checkout config not ready yet.')),
      );
      return;
    }

    final receipt = await provider.submitOrder();
    if (!context.mounted || receipt == null) {
      if (provider.errorMessage != null && context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(provider.errorMessage!)));
      }
      return;
    }

    provider.clearSelection();

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => CheckoutScreen(
          items: selected,
          total: total,
          adminPhone: config.adminPhone,
          paymentInstructions: config.paymentInstructions,
          orderId: receipt.id,
          createdAt: receipt.createdAt,
        ),
      ),
    );
  }
}
