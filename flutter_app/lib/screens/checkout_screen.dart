import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/order_models.dart';
import '../theme/app_theme.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({
    super.key,
    required this.items,
    required this.total,
    required this.adminPhone,
    required this.paymentInstructions,
    required this.telebirrMerchantName,
    required this.telebirrPhone,
    required this.telebirrQrImageUrl,
    required this.orderId,
    required this.createdAt,
  });

  final List<OrderLine> items;
  final double total;
  final String adminPhone;
  final String paymentInstructions;
  final String telebirrMerchantName;
  final String telebirrPhone;
  final String telebirrQrImageUrl;
  final String orderId;
  final DateTime createdAt;

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Stack(
        children: <Widget>[
          Positioned(
            right: -40,
            top: 40,
            bottom: 0,
            child: Opacity(
              opacity: 0.16,
              child: Image.asset('assets/images/motif.jpg'),
            ),
          ),
          ListView(
            padding: const EdgeInsets.fromLTRB(18, 10, 18, 24),
            children: <Widget>[
              _StatusCard(
                orderId: orderId,
                createdAt: createdAt,
                total: total,
                palette: palette,
              ),
              const SizedBox(height: 14),
              _TelebirrPaymentCard(
                total: total,
                orderId: orderId,
                merchantName: telebirrMerchantName,
                telebirrPhone: telebirrPhone.isNotEmpty
                    ? telebirrPhone
                    : adminPhone,
                qrImageUrl: telebirrQrImageUrl,
                instructions: paymentInstructions,
                palette: palette,
              ),
              const SizedBox(height: 14),
              _SummaryCard(items: items, total: total, palette: palette),
              const SizedBox(height: 16),
              SizedBox(
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: () => _callAdmin(context, adminPhone),
                  icon: const Icon(Icons.call_rounded),
                  label: const Text('Call Admin Now'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0B7B78),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
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

  Future<void> _callAdmin(BuildContext context, String phone) async {
    final telUri = Uri.parse('tel:$phone');
    final launched = await launchUrl(
      telUri,
      mode: LaunchMode.externalApplication,
    );

    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open dialer on this device.')),
      );
    }
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.orderId,
    required this.createdAt,
    required this.total,
    required this.palette,
  });

  final String orderId;
  final DateTime createdAt;
  final double total;
  final DreamPalette palette;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: <Widget>[
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF0B7B78).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF0B7B78),
                size: 28,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Order submitted',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: palette.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    orderId,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: palette.textMuted,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Placed ${createdAt.toLocal()}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: palette.textMuted),
                  ),
                ],
              ),
            ),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                '${total.toStringAsFixed(0)} ETB',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0A3534),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TelebirrPaymentCard extends StatelessWidget {
  const _TelebirrPaymentCard({
    required this.total,
    required this.orderId,
    required this.merchantName,
    required this.telebirrPhone,
    required this.qrImageUrl,
    required this.instructions,
    required this.palette,
  });

  final double total;
  final String orderId;
  final String merchantName;
  final String telebirrPhone;
  final String qrImageUrl;
  final String instructions;
  final DreamPalette palette;

  bool get _hasQr => qrImageUrl.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.black.withValues(alpha: 0.06),
                    ),
                  ),
                  child: Image.asset(
                    'assets/payments/telebirr_logo.png',
                    width: 96,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'Scan to pay',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: palette.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Pay exact amount, then call admin with your order ID.',
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.25,
                          color: palette.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Center(
              child: _QrPanel(
                qrImageUrl: qrImageUrl,
                hasQr: _hasQr,
                palette: palette,
              ),
            ),
            const SizedBox(height: 16),
            _PaymentDetailRow(
              label: 'Amount',
              value: '${total.toStringAsFixed(0)} ETB',
              palette: palette,
              strong: true,
            ),
            _PaymentDetailRow(
              label: 'Order ID',
              value: orderId,
              palette: palette,
            ),
            if (merchantName.isNotEmpty)
              _PaymentDetailRow(
                label: 'Merchant',
                value: merchantName,
                palette: palette,
              ),
            if (telebirrPhone.isNotEmpty)
              _PaymentDetailRow(
                label: 'Telebirr',
                value: telebirrPhone,
                palette: palette,
              ),
            const SizedBox(height: 10),
            Text(
              _hasQr
                  ? instructions
                  : 'Admin must add the real Telebirr merchant QR image in the admin config before this becomes scannable.',
              style: TextStyle(
                fontSize: 12.5,
                height: 1.35,
                color: palette.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QrPanel extends StatelessWidget {
  const _QrPanel({
    required this.qrImageUrl,
    required this.hasQr,
    required this.palette,
  });

  final String qrImageUrl;
  final bool hasQr;
  final DreamPalette palette;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 218,
      height: 218,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.black.withValues(alpha: 0.08)),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.10),
            blurRadius: 22,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: hasQr
            ? Image.network(
                qrImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    _QrPlaceholder(palette: palette),
              )
            : _QrPlaceholder(palette: palette),
      ),
    );
  }
}

class _QrPlaceholder extends StatelessWidget {
  const _QrPlaceholder({required this.palette});

  final DreamPalette palette;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        CustomPaint(painter: _QrPlaceholderPainter()),
        Center(
          child: Container(
            width: 118,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.black.withValues(alpha: 0.08)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Image.asset(
                  'assets/payments/telebirr_logo.png',
                  width: 80,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 4),
                Text(
                  'QR not set',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: palette.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _QrPlaceholderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF0B7B78);
    final faint = Paint()..color = const Color(0xFFE6F1F0);
    final cell = size.width / 13;

    canvas.drawRect(Offset.zero & size, faint);
    for (var y = 0; y < 13; y++) {
      for (var x = 0; x < 13; x++) {
        final finder = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
        final patterned = (x * 3 + y * 5) % 4 == 0 || (x + y) % 7 == 0;
        if (finder || patterned) {
          canvas.drawRRect(
            RRect.fromRectAndRadius(
              Rect.fromLTWH(x * cell + 2, y * cell + 2, cell - 4, cell - 4),
              const Radius.circular(2),
            ),
            paint,
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _PaymentDetailRow extends StatelessWidget {
  const _PaymentDetailRow({
    required this.label,
    required this.value,
    required this.palette,
    this.strong = false,
  });

  final String label;
  final String value;
  final DreamPalette palette;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: palette.textMuted,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: strong ? 17 : 13,
                fontWeight: strong ? FontWeight.w900 : FontWeight.w800,
                color: palette.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.items,
    required this.total,
    required this.palette,
  });

  final List<OrderLine> items;
  final double total;
  final DreamPalette palette;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Order summary',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: palette.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            ...items.map(
              (line) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        '${line.quantity} x ${line.name}',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: palette.textPrimary,
                        ),
                      ),
                    ),
                    Text(
                      '${(line.price * line.quantity).toStringAsFixed(0)} ETB',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: palette.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 26),
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    'Total',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: palette.textPrimary,
                    ),
                  ),
                ),
                Text(
                  '${total.toStringAsFixed(0)} ETB',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: palette.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
