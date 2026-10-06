/// Abstract contract for OCR engines (Google ML Kit, Apple Vision, or Cloud OCR)
abstract class OcrService {
  Future<OcrResult> extractText(String imagePathOrBase64);
}

class OcrResult {
  final String rawText;
  final List<OcrTextBlock> blocks;
  final double confidence;

  const OcrResult({
    required this.rawText,
    this.blocks = const [],
    this.confidence = 0.90,
  });

  factory OcrResult.fromJson(Map<String, dynamic> json) {
    return OcrResult(
      rawText: json['rawText'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.90,
    );
  }

  Map<String, dynamic> toJson() => {
    'rawText': rawText,
    'confidence': confidence,
  };
}

class OcrTextBlock {
  final String text;
  final double? confidence;

  const OcrTextBlock({required this.text, this.confidence});
}
