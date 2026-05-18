import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Modal bottom sheet collecting the minimum info we need to fulfil + map an
/// order: phone, address, optional note. Returns the captured values when
/// the user taps Continue; `null` if dismissed.
class DeliveryDetails {
  const DeliveryDetails({
    required this.phone,
    required this.address,
    this.name,
    this.note,
  });

  final String phone;
  final String address;
  final String? name;
  final String? note;
}

Future<DeliveryDetails?> showDeliverySheet(BuildContext context) {
  return showModalBottomSheet<DeliveryDetails>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _DeliverySheet(),
  );
}

class _DeliverySheet extends StatefulWidget {
  const _DeliverySheet();

  @override
  State<_DeliverySheet> createState() => _DeliverySheetState();
}

class _DeliverySheetState extends State<_DeliverySheet> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _note = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    _note.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      DeliveryDetails(
        name: _name.text.trim().isEmpty ? null : _name.text.trim(),
        phone: _phone.text.trim(),
        address: _address.text.trim(),
        note: _note.text.trim().isEmpty ? null : _note.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);
    final viewInsets = MediaQuery.viewInsetsOf(context);

    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: palette.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: palette.glassBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                'Delivery details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: palette.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'We use this to deliver your order and map your location.',
                style: TextStyle(fontSize: 12, color: palette.textMuted),
              ),
              const SizedBox(height: 14),
              _Field(
                label: 'Name (optional)',
                controller: _name,
                hint: 'Your name',
              ),
              const SizedBox(height: 10),
              _Field(
                label: 'Phone',
                controller: _phone,
                hint: '+2519…',
                keyboardType: TextInputType.phone,
                validator: (v) =>
                    (v == null || v.trim().length < 7) ? 'Phone required' : null,
              ),
              const SizedBox(height: 10),
              _Field(
                label: 'Delivery address',
                controller: _address,
                hint: 'e.g. Bole, near Edna Mall, Addis Ababa',
                maxLines: 2,
                validator: (v) =>
                    (v == null || v.trim().length < 4) ? 'Address required' : null,
              ),
              const SizedBox(height: 10),
              _Field(
                label: 'Note (optional)',
                controller: _note,
                hint: 'Landmarks, gate code, etc.',
                maxLines: 2,
              ),
              const SizedBox(height: 18),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF9800),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  child: const Text('Continue to checkout'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.validator,
    this.maxLines = 1,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
            color: palette.textMuted,
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          validator: validator,
          style: TextStyle(fontSize: 14, color: palette.textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: palette.textMuted.withValues(alpha: 0.6),
              fontSize: 13,
            ),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 10,
            ),
            filled: true,
            fillColor: palette.glassFill,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: palette.glassBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: palette.glassBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: palette.textMuted),
            ),
          ),
        ),
      ],
    );
  }
}
