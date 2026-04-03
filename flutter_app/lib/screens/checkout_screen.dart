import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/order_models.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({
    super.key,
    required this.items,
    required this.total,
    required this.adminPhone,
    required this.paymentInstructions,
    required this.orderId,
    required this.createdAt,
  });

  final List<OrderLine> items;
  final double total;
  final String adminPhone;
  final String paymentInstructions;
  final String orderId;
  final DateTime createdAt;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Stack(
        children: <Widget>[
          Positioned(
            right: -40,
            top: 40,
            bottom: 0,
            child: Opacity(
              opacity: 0.2,
              child: Image.asset('assets/images/motif.jpg'),
            ),
          ),
          ListView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
            children: <Widget>[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Text(
                        'Order Submitted ✅',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0B7B78),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text('Order ID: $orderId'),
                      Text('Placed: ${createdAt.toLocal()}'),
                      const SizedBox(height: 14),
                      const Divider(),
                      const SizedBox(height: 8),
                      const Text(
                        'Summary',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...items.map(
                        (line) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  '${line.name} × ${line.quantity}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              Text(
                                '${(line.price * line.quantity).toStringAsFixed(2)} ETB',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Divider(height: 28),
                      Row(
                        children: <Widget>[
                          const Expanded(
                            child: Text(
                              'Total',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Text(
                            '${total.toStringAsFixed(2)} ETB',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0A3534),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Text(
                        'Payment Instructions',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0B7B78),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        paymentInstructions,
                        style: const TextStyle(height: 1.4),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Need help? Call admin: $adminPhone',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: () => _callAdmin(context, adminPhone),
                  icon: const Icon(Icons.call),
                  label: const Text('Call Admin Now'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0B7B78),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 18,
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
