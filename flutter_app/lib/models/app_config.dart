class AppConfig {
  AppConfig({
    required this.adminPhone,
    required this.paymentInstructions,
    this.telebirrMerchantName = '',
    this.telebirrPhone = '',
    this.telebirrQrImageUrl = '',
  });

  final String adminPhone;
  final String paymentInstructions;
  final String telebirrMerchantName;
  final String telebirrPhone;
  final String telebirrQrImageUrl;

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    return AppConfig(
      adminPhone: (json['adminPhone'] ?? '').toString(),
      paymentInstructions: (json['paymentInstructions'] ?? '').toString(),
      telebirrMerchantName: (json['telebirrMerchantName'] ?? '').toString(),
      telebirrPhone: (json['telebirrPhone'] ?? '').toString(),
      telebirrQrImageUrl: (json['telebirrQrImageUrl'] ?? '').toString(),
    );
  }
}
