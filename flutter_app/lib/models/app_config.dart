class AppConfig {
  AppConfig({required this.adminPhone, required this.paymentInstructions});

  final String adminPhone;
  final String paymentInstructions;

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    return AppConfig(
      adminPhone: (json['adminPhone'] ?? '').toString(),
      paymentInstructions: (json['paymentInstructions'] ?? '').toString(),
    );
  }
}
