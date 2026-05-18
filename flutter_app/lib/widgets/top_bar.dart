import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../theme/app_theme.dart';
import '../theme/theme_controller.dart';

/// Floating header above the content stack: lightning glyph + theme toggle.
class TopBar extends StatelessWidget {
  const TopBar({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = DreamPaletteScope.of(context);
    final controller = context.watch<ThemeController>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 8),
      child: Row(
        children: <Widget>[
          Image.asset(
            'assets/branding/logo_1024.png',
            width: 36,
            height: 36,
            filterQuality: FilterQuality.medium,
          ),
          const SizedBox(width: 10),
          Text(
            'Dream',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
              color: palette.textPrimary,
            ),
          ),
          const Spacer(),
          _ThemeTogglePill(
            isDark: controller.isDark,
            onTap: controller.toggle,
            palette: palette,
          ),
        ],
      ),
    );
  }
}

class _ThemeTogglePill extends StatelessWidget {
  const _ThemeTogglePill({
    required this.isDark,
    required this.onTap,
    required this.palette,
  });

  final bool isDark;
  final VoidCallback onTap;
  final DreamPalette palette;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        width: 64,
        height: 30,
        decoration: BoxDecoration(
          color: palette.toggleTrack,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: <Widget>[
            AnimatedAlign(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              alignment: isDark
                  ? Alignment.centerLeft
                  : Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: palette.toggleKnob,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Icon(
                    Icons.nightlight_round,
                    size: 14,
                    color: isDark
                        ? palette.toggleIcon
                        : Colors.white.withValues(alpha: 0.85),
                  ),
                  Icon(
                    Icons.wb_sunny_rounded,
                    size: 14,
                    color: !isDark
                        ? palette.toggleIcon
                        : Colors.white.withValues(alpha: 0.85),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
