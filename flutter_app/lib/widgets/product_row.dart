import 'package:flutter/material.dart';

import '../models/product.dart';
import '../theme/app_theme.dart';
import 'glass_container.dart';

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
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      borderRadius: 14,
      child: Row(
        children: <Widget>[
          Expanded(
            flex: 5,
            child: Text(
              product.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
                color: palette.textPrimary,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              '${product.price.toStringAsFixed(0)} ETB',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: palette.textMuted,
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
            width: 30,
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
    final background = isPrimary
        ? const Color(0xFF0B7B78)
        : palette.glassFill;
    final foreground = isPrimary
        ? Colors.white
        : palette.textPrimary;
    final disabled = onPressed == null;

    return SizedBox(
      width: 32,
      height: 32,
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
        child: Icon(icon, size: 16, color: disabled ? foreground.withValues(alpha: 0.4) : foreground),
      ),
    );
  }
}
