import 'dart:async';

import 'package:flutter/material.dart';

import '../models/ad.dart';
import '../theme/app_theme.dart';

class AdCarousel extends StatefulWidget {
  const AdCarousel({super.key, required this.ads});

  final List<AdBanner> ads;

  @override
  State<AdCarousel> createState() => _AdCarouselState();
}

class _AdCarouselState extends State<AdCarousel> {
  late final PageController _pageController;
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _setupAutoScroll();
  }

  @override
  void didUpdateWidget(covariant AdCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.ads.length != widget.ads.length) {
      _setupAutoScroll();
    }
  }

  void _setupAutoScroll() {
    _timer?.cancel();
    if (widget.ads.length <= 1) {
      return;
    }

    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || widget.ads.isEmpty) {
        return;
      }
      _index = (_index + 1) % widget.ads.length;
      _pageController.animateToPage(
        _index,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.ads.isEmpty) {
      return const _AdCard(
        title: 'Fresh Deals Near You',
        subtitle: 'Order quickly from local restaurants and businesses.',
        tag: 'Featured',
        imageUrl: null,
      );
    }

    return Column(
      children: <Widget>[
        SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.ads.length,
            onPageChanged: (value) => setState(() => _index = value),
            itemBuilder: (context, index) {
              final ad = widget.ads[index];
              return _AdCard(
                title: ad.title,
                subtitle: ad.subtitle,
                tag: ad.tag ?? 'Ad',
                imageUrl: ad.imageUrl,
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List<Widget>.generate(widget.ads.length, (dotIndex) {
            final active = dotIndex == _index;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              height: 7,
              width: active ? 16 : 7,
              decoration: BoxDecoration(
                color: active
                    ? const Color(0xFFFF9800)
                    : Colors.white.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(20),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _AdCard extends StatelessWidget {
  const _AdCard({
    required this.title,
    required this.subtitle,
    required this.tag,
    required this.imageUrl,
  });

  final String title;
  final String subtitle;
  final String tag;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Stack(
          children: <Widget>[
            Positioned.fill(
              child: imageUrl == null || imageUrl!.isEmpty
                  ? Image.asset(
                      'assets/images/design_ad.jpg',
                      fit: BoxFit.cover,
                    )
                  : Image.network(
                      imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, error, stackTrace) => Image.asset(
                        'assets/images/design_ad.jpg',
                        fit: BoxFit.cover,
                      ),
                    ),
            ),
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: <Color>[
                      Colors.black.withValues(alpha: 0.05),
                      Colors.black.withValues(alpha: 0.55),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ),
            Positioned(
              left: 12,
              top: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: palette.accent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  tag,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
              ),
            ),
            Positioned(
              right: 12,
              top: 12,
              child: Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.favorite,
                  size: 18,
                  color: Colors.red.shade400,
                ),
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: 12,
              child: Container(
                decoration: BoxDecoration(
                  color: palette.accent,
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
