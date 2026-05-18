import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/order_provider.dart';
import 'screens/home_screen.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';
import 'theme/theme_controller.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DreamApp());
}

class DreamApp extends StatelessWidget {
  const DreamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<ThemeController>(
          create: (_) => ThemeController(),
        ),
        ChangeNotifierProvider<OrderProvider>(
          create: (_) => OrderProvider(apiService: ApiService())
            ..loadInitialData(),
        ),
      ],
      child: Consumer<ThemeController>(
        builder: (context, themeCtrl, _) {
          final palette = themeCtrl.isDark
              ? DreamPalette.dark
              : DreamPalette.light;
          return DreamPaletteScope(
            palette: palette,
            child: MaterialApp(
              title: 'Dream',
              debugShowCheckedModeBanner: false,
              themeMode: themeCtrl.mode,
              theme: buildLightTheme(),
              darkTheme: buildDarkTheme(),
              home: const HomeScreen(),
            ),
          );
        },
      ),
    );
  }
}
