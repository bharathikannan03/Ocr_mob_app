import 'package:dio/dio.dart';
import '../domain/contact_model.dart';
import '../../../core/network/api_client.dart';

abstract class ContactRepository {
  Future<List<ContactModel>> getContacts({String? query, String? source});
  Future<ContactModel> createContact(Map<String, dynamic> contactData);
  Future<ContactModel> updateContact(String id, Map<String, dynamic> contactData);
  Future<void> deleteContact(String id);
  Future<Map<String, dynamic>> checkDuplicate(Map<String, dynamic> data);
}

class ContactRepositoryImpl implements ContactRepository {
  final ApiClient apiClient;

  ContactRepositoryImpl({required this.apiClient});

  @override
  Future<List<ContactModel>> getContacts({String? query, String? source}) async {
    final response = await apiClient.dio.get('/contacts', queryParameters: {
      if (query != null) 'q': query,
      if (source != null) 'source': source,
    });
    final list = (response.data['data']['contacts'] as List)
        .map((json) => ContactModel.fromJson(json))
        .toList();
    return list;
  }

  @override
  Future<ContactModel> createContact(Map<String, dynamic> contactData) async {
    final response = await apiClient.dio.post('/contacts', data: contactData);
    return ContactModel.fromJson(response.data['data']['contact']);
  }

  @override
  Future<ContactModel> updateContact(String id, Map<String, dynamic> contactData) async {
    final response = await apiClient.dio.put('/contacts/$id', data: contactData);
    return ContactModel.fromJson(response.data['data']['contact']);
  }

  @override
  Future<void> deleteContact(String id) async {
    await apiClient.dio.delete('/contacts/$id');
  }

  @override
  Future<Map<String, dynamic>> checkDuplicate(Map<String, dynamic> data) async {
    final response = await apiClient.dio.post('/contacts/check-duplicate', data: data);
    return response.data['data'] as Map<String, dynamic>;
  }
}
