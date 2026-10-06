/// Abstract contract for parsing raw OCR text into structured contact models
abstract class ContactExtractionService {
  Future<ExtractedContact> extractContact(String rawText, {String? imageBase64});
}

class ExtractedContact {
  final String name;
  final String designation;
  final String company;
  final String email;
  final String phone;
  final String website;
  final String address;
  final String city;
  final String state;
  final String country;
  final String? linkedin;
  final String? notes;
  final Map<String, double> fieldConfidences;

  const ExtractedContact({
    required this.name,
    this.designation = '',
    this.company = '',
    this.email = '',
    this.phone = '',
    this.website = '',
    this.address = '',
    this.city = '',
    this.state = '',
    this.country = '',
    this.linkedin,
    this.notes,
    this.fieldConfidences = const {},
  });

  factory ExtractedContact.fromJson(Map<String, dynamic> json) {
    final conf = <String, double>{};
    if (json['fieldConfidences'] is Map) {
      (json['fieldConfidences'] as Map).forEach((k, v) {
        if (v is num) conf[k.toString()] = v.toDouble();
      });
    }

    return ExtractedContact(
      name: json['name'] as String? ?? '',
      designation: json['designation'] as String? ?? '',
      company: json['company'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      website: json['website'] as String? ?? '',
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      country: json['country'] as String? ?? '',
      linkedin: json['linkedin'] as String?,
      notes: json['notes'] as String?,
      fieldConfidences: conf,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'designation': designation,
    'company': company,
    'email': email,
    'phone': phone,
    'website': website,
    'address': address,
    'city': city,
    'state': state,
    'country': country,
    'linkedin': linkedin,
    'notes': notes,
    'fieldConfidences': fieldConfidences,
  };
}
