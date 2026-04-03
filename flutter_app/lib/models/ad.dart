class AdBanner {
  AdBanner({
    required this.id,
    required this.title,
    required this.subtitle,
    this.imageUrl,
    this.tag,
  });

  final String id;
  final String title;
  final String subtitle;
  final String? imageUrl;
  final String? tag;

  factory AdBanner.fromJson(Map<String, dynamic> json) {
    return AdBanner(
      id: json['id'].toString(),
      title: (json['title'] ?? '').toString(),
      subtitle: (json['subtitle'] ?? '').toString(),
      imageUrl: json['imageUrl']?.toString(),
      tag: json['tag']?.toString(),
    );
  }
}
