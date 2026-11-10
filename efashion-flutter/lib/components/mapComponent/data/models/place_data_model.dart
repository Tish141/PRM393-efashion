import 'package:efashion_flutter/components/mapComponent/domain/entities/place_data.dart';

class PlaceDataModel extends PlaceData {
  const PlaceDataModel({required super.latitude, required super.longitude});

  factory PlaceDataModel.fromJson(Map<String, dynamic> jsonData) {
    final lat = jsonData['lat'] ?? jsonData['latitude'] ?? 0.0;
    final lng = jsonData['lng'] ?? jsonData['longitude'] ?? 0.0;
    return PlaceDataModel(
      latitude: (lat as num).toDouble(),
      longitude: (lng as num).toDouble(),
    );
  }
}
