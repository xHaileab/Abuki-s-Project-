import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/order_provider.dart';
import 'screens/home_screen.dart';
import 'services/api_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DreamApp());
}

class DreamApp extends StatelessWidget {
  const DreamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<OrderProvider>(
      create: (_) => OrderProvider(apiService: ApiService())..loadInitialData(),
      child: MaterialApp(
        title: 'Dream',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF0B7B78),
            primary: const Color(0xFF0B7B78),
            secondary: const Color(0xFFFF9800),
            surface: const Color(0xFFEFF8F8),
          ),
          scaffoldBackgroundColor: const Color(0xFF33C7C9),
          cardTheme: CardThemeData(
            color: const Color(0xFFEAF5F5),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.transparent,
            elevation: 0,
            foregroundColor: Colors.white,
          ),
          useMaterial3: true,
        ),
        home: const HomeScreen(),
      ),
    );
  }
}
