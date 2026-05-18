import 'package:flutter/material.dart';

/// Drives the app-wide light/dark mode.
///
/// Held high in the widget tree via [ChangeNotifierProvider] so the top bar
/// toggle and any consumer can react instantly.
class ThemeController extends ChangeNotifier {
  ThemeController({ThemeMode initial = ThemeMode.light}) : _mode = initial;

  ThemeMode _mode;
  ThemeMode get mode => _mode;

  bool get isDark => _mode == ThemeMode.dark;

  void toggle() {
    _mode = _mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
  }

  void setDark(bool dark) {
    final next = dark ? ThemeMode.dark : ThemeMode.light;
    if (next == _mode) return;
    _mode = next;
    notifyListeners();
  }
}
