class AppConstants {
  static const String appName = 'CardScan AI';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.cardscan.example.com/api',
  );

  // Storage Keys
  static const String accessTokenKey = 'auth_access_token';
  static const String refreshTokenKey = 'auth_refresh_token';
  static const String userProfileKey = 'auth_user_profile';

  // Card Aspect Ratio (Standard Business Card 3.5" x 2.0")
  static const double cardAspectRatio = 1.75;
}
