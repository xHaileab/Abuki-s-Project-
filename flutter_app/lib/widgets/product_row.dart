import 'package:flutter/material.dart';

import '../models/product.dart';
import '../theme/app_theme.dart';

class ProductRow extends StatelessWidget {
  const ProductRow({
    super.key,
    required this.product,
    required this.quantity,
    required this.onDecrement,
    required this.onIncrement,
  });

  final Product product;
  final int quantity;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);
    final selected = quantity > 0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: selected
            ? Colors.white.withValues(alpha: 0.72)
            : palette.glassFill,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: selected
              ? const Color(0xFFFF9800).withValues(alpha: 0.55)
              : palette.glassBorder,
        ),
        boxShadow: selected
            ? <BoxShadow>[
                BoxShadow(
                  color: const Color(0xFFFF9800).withValues(alpha: 0.14),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: selected
                  ? const Color(0xFFFF9800).withValues(alpha: 0.18)
                  : palette.cardFill,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: palette.glassBorder),
            ),
            child: Icon(
              Icons.shopping_basket_rounded,
              size: 20,
              color: selected ? const Color(0xFFB85D00) : palette.textMuted,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15.5,
                    color: palette.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${product.price.toStringAsFixed(0)} ETB each',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: palette.textMuted,
                  ),
                ),
              ],
            ),
          ),
          if (selected)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Text(
                '${(product.price * quantity).toStringAsFixed(0)} ETB',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: palette.textPrimary,
                ),
              ),
            ),
          _QtyButton(
            icon: Icons.remove,
            onPressed: quantity > 0 ? onDecrement : null,
            isPrimary: false,
            palette: palette,
          ),
          SizedBox(
            width: 34,
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 17,
                color: palette.textPrimary,
              ),
            ),
          ),
          _QtyButton(
            icon: Icons.add,
            onPressed: onIncrement,
            isPrimary: true,
            palette: palette,
          ),
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({
    required this.icon,
    required this.onPressed,
    required this.isPrimary,
    required this.palette,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final bool isPrimary;
  final DreamPalette palette;

  @override
  Widget build(BuildContext context) {
    final background = isPrimary ? const Color(0xFF0B7B78) : palette.glassFill;
    final foreground = isPrimary ? Colors.white : palette.textPrimary;
    final disabled = onPressed == null;

    return SizedBox(
      width: 36,
      height: 36,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(color: palette.glassBorder, width: 1),
          ),
          backgroundColor: background,
          foregroundColor: foreground,
          disabledBackgroundColor: background.withValues(alpha: 0.4),
          disabledForegroundColor: foreground.withValues(alpha: 0.4),
          elevation: 0,
        ),
        child: Icon(
          icon,
          size: 17,
          color: disabled ? foreground.withValues(alpha: 0.4) : foreground,
        ),
      ),
    );
  }
}
