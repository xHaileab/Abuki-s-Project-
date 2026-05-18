import 'package:flutter/material.dart';

/// Centralised color tokens for light and dark modes.
///
/// Pulled out of [ThemeData] so widgets can grab semi-transparent surfaces,
/// hairline borders, and motif tints without re-deriving them everywhere.
class DreamPalette {
  const DreamPalette({
    required this.background,
    required this.accent,
    required this.accentText,
    required this.glassFill,
    required this.glassBorder,
    required this.cardFill,
    required this.cardBorder,
    required this.textPrimary,
    required this.textMuted,
    required this.totalText,
    required this.motifTint,
    required this.motifBlendMode,
    required this.motifOpacity,
    required this.toggleTrack,
    required this.toggleKnob,
    required this.toggleIcon,
  });

  final Color background;
  final Color accent;
  final Color accentText;
  final Color glassFill;
  final Color glassBorder;
  final Color cardFill;
  final Color cardBorder;
  final Color textPrimary;
  final Color textMuted;
  final Color totalText;
  final Color motifTint;
  final BlendMode motifBlendMode;
  final double motifOpacity;
  final Color toggleTrack;
  final Color toggleKnob;
  final Color toggleIcon;

  static const DreamPalette light = DreamPalette(
    background: Color(0xFF33C7C9),
    accent: Color(0xFFFF9800),
    accentText: Colors.black87,
    glassFill: Color(0x66FFFFFF),
    glassBorder: Color(0x33FFFFFF),
    cardFill: Color(0x80FFFFFF),
    cardBorder: Color(0x40FFFFFF),
    textPrimary: Color(0xFF0A3534),
    textMuted: Color(0xFF0B5F5D),
    totalText: Color(0xFF0A3534),
    motifTint: Color(0xFF0B7B78),
    motifBlendMode: BlendMode.softLight,
    motifOpacity: 0.18,
    toggleTrack: Color(0xFF0B7B78),
    toggleKnob: Colors.white,
    toggleIcon: Color(0xFF0A3534),
  );

  static const DreamPalette dark = DreamPalette(
    background: Color(0xFF0F3A38),
    accent: Color(0xFFFF9800),
    accentText: Colors.black87,
    glassFill: Color(0x33000000),
    glassBorder: Color(0x22FFFFFF),
    cardFill: Color(0x66102E2C),
    cardBorder: Color(0x22FFFFFF),
    textPrimary: Color(0xFFE6F1F0),
    textMuted: Color(0xFF9CC4C2),
    totalText: Color(0xFFE6F1F0),
    motifTint: Color(0xFF1F5F5C),
    motifBlendMode: BlendMode.softLight,
    motifOpacity: 0.14,
    toggleTrack: Color(0xFF0B7B78),
    toggleKnob: Color(0xFFE6F1F0),
    toggleIcon: Color(0xFF0F3A38),
  );
}

/// Lets widgets read the active palette via `DreamPaletteScope.of(context)`.
class DreamPaletteScope extends InheritedWidget {
  const DreamPaletteScope({
    super.key,
    required this.palette,
    required super.child,
  });

  final DreamPalette palette;

  static DreamPalette of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<DreamPaletteScope>();
    assert(scope != null, 'DreamPaletteScope missing in widget tree');
    return scope!.palette;
  }

  @override
  bool updateShouldNotify(DreamPaletteScope oldWidget) =>
      palette != oldWidget.palette;
}

ThemeData buildLightTheme() => _buildThemeData(DreamPalette.light, Brightness.light);
ThemeData buildDarkTheme() => _buildThemeData(DreamPalette.dark, Brightness.dark);

ThemeData _buildThemeData(DreamPalette palette, Brightness brightness) {
  final scheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF0B7B78),
    brightness: brightness,
    primary: const Color(0xFF0B7B78),
    secondary: palette.accent,
    surface: palette.background,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: palette.background,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      foregroundColor: Colors.white,
    ),
    cardTheme: CardThemeData(
      color: palette.cardFill,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: palette.cardBorder, width: 1),
      ),
    ),
    textTheme: Typography.material2021(platform: TargetPlatform.android)
        .black
        .apply(
          bodyColor: palette.textPrimary,
          displayColor: palette.textPrimary,
        ),
  );
}
