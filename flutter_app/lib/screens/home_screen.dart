import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/order_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/ad_carousel.dart';
import '../widgets/delivery_sheet.dart';
import '../widgets/glass_container.dart';
import '../widgets/product_row.dart';
import '../widgets/top_bar.dart';
import 'checkout_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);

    return Scaffold(
      body: Stack(
        children: <Widget>[
          // Ambient motif: tinted + soft-light blended so it reads as
          // texture rather than a foreground image. Mode-aware.
          Positioned.fill(
            child: IgnorePointer(
              child: Opacity(
                opacity: palette.motifOpacity,
                child: ColorFiltered(
                  colorFilter: ColorFilter.mode(
                    palette.motifTint,
                    palette.motifBlendMode,
                  ),
                  child: Image.asset(
                    'assets/images/motif.jpg',
                    fit: BoxFit.cover,
                    alignment: Alignment.topRight,
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: <Widget>[
                const TopBar(),
                Expanded(
                  child: Consumer<OrderProvider>(
                    builder: (context, provider, _) {
                      if (provider.isLoading && provider.products.isEmpty) {
                        return const Center(
                          child: CircularProgressIndicator(),
                        );
                      }

                      return RefreshIndicator(
                        onRefresh: provider.loadInitialData,
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(18, 4, 18, 24),
                          children: <Widget>[
                            AdCarousel(ads: provider.ads),
                            const SizedBox(height: 14),
                            _OrderDetailsCard(provider: provider),
                            const SizedBox(height: 14),
                            _BuyButton(provider: provider),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderDetailsCard extends StatelessWidget {
  const _OrderDetailsCard({required this.provider});

  final OrderProvider provider;

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);
    return GlassContainer(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      borderRadius: 20,
      blurSigma: 18,
      fillOverride: palette.cardFill,
      borderOverride: palette.cardBorder,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(
                Icons.shopping_basket_outlined,
                size: 18,
                color: palette.textMuted,
              ),
              const SizedBox(width: 6),
              Text(
                'Order Details',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: palette.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (provider.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
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
              padding: const EdgeInsets.only(bottom: 8),
              child: ProductRow(
                product: product,
                quantity: provider.quantityFor(product.id),
                onDecrement: () => provider.decrement(product.id),
                onIncrement: () => provider.increment(product.id),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            height: 1,
            color: palette.glassBorder,
          ),
          const SizedBox(height: 10),
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  'Total',
                  style: TextStyle(
                    fontSize: 14,
                    color: palette.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    '${provider.total.toStringAsFixed(0)} ETB',
                    style: TextStyle(
                      fontSize: 22,
                      color: palette.totalText,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BuyButton extends StatelessWidget {
  const _BuyButton({required this.provider});

  final OrderProvider provider;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
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
            fontSize: 20,
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

    final details = await showDeliverySheet(context);
    if (details == null) return;
    if (!context.mounted) return;

    final receipt = await provider.submitOrder(
      customerName: details.name,
      customerPhone: details.phone,
      address: details.address,
      addressNote: details.note,
    );
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
