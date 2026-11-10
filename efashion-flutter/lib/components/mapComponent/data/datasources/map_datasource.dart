import 'package:dio/dio.dart';
import 'package:efashion_flutter/components/mapComponent/data/models/place_data_model.dart';
import 'package:efashion_flutter/components/mapComponent/data/models/place_model.dart';
import 'package:efashion_flutter/shared/api/api_consumer.dart';
import 'package:efashion_flutter/shared/constants/api_constants.dart';
import 'package:efashion_flutter/shared/error/exception.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:injectable/injectable.dart';

abstract class MapDataSource {
  Future<List<PlaceModel>> getPlacesSuggestions({required String searchQuery});
  Future<PlaceDataModel> getPlaceLatitudeAndLongitude({required String placeId});
  Future<PlaceDataModel> getUserLocationUseCase();
  Future<String> updateUserLocationUseCase({required double latitude, required double longitude});
}

@LazySingleton(as: MapDataSource)
class MapDataSourceImpl extends MapDataSource {
  final ApiConsumer _mainApiConsumer;
  final ApiConsumer _mapApiConsumer;

  String get googleMapsKey =>
      dotenv.isInitialized ? (dotenv.env["GOOGLE_MAPS_KEY"] ?? '') : '';

  MapDataSourceImpl(
    @Named(ApiConstants.authenticatedConsumer) this._mainApiConsumer,
    @Named(ApiConstants.mapsConsumerName) this._mapApiConsumer,
  );

  @override
  Future<List<PlaceModel>> getPlacesSuggestions({required String searchQuery}) async {
    if (searchQuery.trim().isEmpty) {
      return [];
    }
    if (googleMapsKey.isNotEmpty) {
      try {
        final response = await _mapApiConsumer.get(
          ApiConstants.mapPlaceAutoComplete,
          queryParameters: {
            'input': searchQuery,
            'radius': 500,
            'key': googleMapsKey,
          },
        );
        if (response is Map && response['status'] == GoogleMapsCallStatus.ok.value) {
          return List<PlaceModel>.from(
            (response['predictions'] as List).map((place) => PlaceModel.fromJson(place)),
          );
        }
      } catch (_) {}
    }

    // Fallback to OpenStreetMap Nominatim when Google Maps API key is empty or denied
    try {
      final dio = Dio();
      final response = await dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': searchQuery,
          'format': 'json',
          'addressdetails': 1,
          'limit': 5,
        },
        options: Options(
          headers: {'User-Agent': 'EFashionApp/1.0'},
        ),
      );
      if (response.data is List) {
        return (response.data as List).map<PlaceModel>((item) {
          final lat = item['lat']?.toString() ?? '0';
          final lon = item['lon']?.toString() ?? '0';
          final displayName = item['display_name']?.toString() ?? searchQuery;
          return PlaceModel(
            id: 'osm:$lat,$lon',
            name: displayName,
          );
        }).toList();
      }
      return [];
    } catch (_) {
      throw const FetchDataException();
    }
  }

  @override
  Future<PlaceDataModel> getPlaceLatitudeAndLongitude({required String placeId}) async {
    if (placeId.startsWith('osm:')) {
      final coords = placeId.substring(4).split(',');
      if (coords.length == 2) {
        final lat = double.tryParse(coords[0]) ?? 0.0;
        final lon = double.tryParse(coords[1]) ?? 0.0;
        return PlaceDataModel(latitude: lat, longitude: lon);
      }
    }
    final response = await _mapApiConsumer.get(
      ApiConstants.mapPlaceDetails,
      queryParameters: {
        'place_id': placeId,
        'radius': 500,
        'key': googleMapsKey,
      },
    );
    if (response is Map && response['status'] == GoogleMapsCallStatus.ok.value) {
      return PlaceDataModel.fromJson(response['result']['geometry']['location']);
    } else {
      throw const FetchDataException();
    }
  }

  @override
  Future<PlaceDataModel> getUserLocationUseCase() async {
    final response = await _mainApiConsumer.get(ApiConstants.addressEndPoint);
    if (response['status'] == ApiCallStatus.success.value) {
      return PlaceDataModel.fromJson(response['data']['location']);
    } else {
      throw const FetchDataException();
    }
  }

  @override
  Future<String> updateUserLocationUseCase({
    required double latitude,
    required double longitude,
  }) async {
    final response = await _mainApiConsumer.post(
      ApiConstants.addressEndPoint,
      body: {
        "latitude": latitude,
        "longitude": longitude,
      },
    );
    if (response['status'] == ApiCallStatus.success.value) {
      return 'Success! Your Location Updated.';
    } else {
      throw const FetchDataException();
    }
  }
}
