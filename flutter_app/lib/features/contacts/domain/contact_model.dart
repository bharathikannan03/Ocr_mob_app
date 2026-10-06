class ContactModel {
  final String id;
  final String userId;
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
  final String linkedin;
  final String notes;
  final String source;
  final String rawOcrText;
  final String? imageUrl;
  final double ocrConfidence;
  final DateTime createdAt;
  final DateTime updatedAt;

  ContactModel({
    required this.id,
    required this.userId,
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
    this.linkedin = '',
    this.notes = '',
    this.source = 'scanned',
    this.rawOcrText = '',
    this.imageUrl,
    this.ocrConfidence = 0.95,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ContactModel.fromJson(Map<String, dynamic> json) {
    return ContactModel(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      name: json['name'] as String,
      designation: json['designation'] as String? ?? '',
      company: json['company'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      website: json['website'] as String? ?? '',
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      country: json['country'] as String? ?? '',
      linkedin: json['linkedin'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      source: json['source'] as String? ?? 'scanned',
      rawOcrText: json['rawOcrText'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      ocrConfidence: (json['ocrConfidence'] as num?)?.toDouble() ?? 0.95,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
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
    'source': source,
    'rawOcrText': rawOcrText,
    'imageUrl': imageUrl,
    'ocrConfidence': ocrConfidence,
  };
}
