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
                        return const Center(child: CircularProgressIndicator());
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
    final selectedCount = provider.selectedItemCount;
    return GlassContainer(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
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
                'Your basket',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: palette.textPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: selectedCount > 0
                      ? const Color(0xFFFF9800)
                      : palette.glassFill,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: palette.glassBorder),
                ),
                child: Text(
                  selectedCount == 1 ? '1 item' : '$selectedCount items',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: selectedCount > 0
                        ? Colors.black87
                        : palette.textMuted,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            selectedCount == 0
                ? 'Choose products to start an order.'
                : 'Review quantities before checkout.',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: palette.textMuted,
            ),
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
          Container(height: 1, color: palette.glassBorder),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: palette.glassFill,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: palette.glassBorder),
            ),
            child: Row(
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'Order total',
                        style: TextStyle(
                          fontSize: 12,
                          color: palette.textMuted,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        selectedCount == 0
                            ? 'No items selected'
                            : 'Pay with telebirr after placing order',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: palette.textMuted.withValues(alpha: 0.82),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      '${provider.total.toStringAsFixed(0)} ETB',
                      style: TextStyle(
                        fontSize: 24,
                        color: palette.totalText,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
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

class _BuyButton extends StatelessWidget {
  const _BuyButton({required this.provider});

  final OrderProvider provider;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: provider.isSubmitting || !provider.hasSelectedItems
            ? null
            : () => _onBuyNow(context, provider),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFFF9800),
          foregroundColor: Colors.white,
          disabledBackgroundColor: Colors.white.withValues(alpha: 0.35),
          disabledForegroundColor: const Color(
            0xFF0A3534,
          ).withValues(alpha: 0.45),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
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
            : Text(
                provider.hasSelectedItems
                    ? 'Buy Now - ${provider.total.toStringAsFixed(0)} ETB'
                    : 'Add items to continue',
              ),
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
          telebirrMerchantName: config.telebirrMerchantName,
          telebirrPhone: config.telebirrPhone,
          telebirrQrImageUrl: config.telebirrQrImageUrl,
          orderId: receipt.id,
          createdAt: receipt.createdAt,
        ),
      ),
    );
  }
}
