import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../domain/ocr_service.dart';

class MLKitOcrService implements OcrService {
  final TextRecognizer _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  @override
  Future<OcrResult> extractText(String imagePathOrBase64) async {
    try {
      final inputImage = InputImage.fromFilePath(imagePathOrBase64);
      final RecognizedText recognizedText = await _textRecognizer.processImage(inputImage);

      final blocks = recognizedText.blocks
          .map((b) => OcrTextBlock(text: b.text, confidence: 0.95))
          .toList();

      return OcrResult(
        rawText: recognizedText.text,
        blocks: blocks,
        confidence: 0.95,
      );
    } catch (e) {
      return OcrResult(rawText: '', blocks: [], confidence: 0.0);
    }
  }

  void dispose() {
    _textRecognizer.close();
  }
}
