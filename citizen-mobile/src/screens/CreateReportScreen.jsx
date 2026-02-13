import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CreateReportScreen() {
  const [token, setToken] = useState("");

  // dropdown data
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // selections
  const [governorateId, setGovernorateId] = useState("");
  const [districtId, setDistrictId] = useState("");

  // form
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");

  // map location
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [region, setRegion] = useState(null);

  // images
  const [images, setImages] = useState([]); // array of { uri }

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("token");
      if (t) setToken(t);

      // ask permissions
      const locPerm = await Location.requestForegroundPermissionsAsync();
      if (locPerm.status !== "granted") {
        Alert.alert("Permission needed", "Location permission is required to create a report.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const initial = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setCoords(initial);
      setRegion({
        ...initial,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  useEffect(() => {
    // load governorates once token exists
    if (!token) return;

    (async () => {
      try {
        const res = await api.get("/governorates", { headers });
        setGovernorates(res.data);
      } catch (e) {
        Alert.alert("Error", e?.response?.data?.message || "Failed to load governorates");
      }
    })();
  }, [token]);

  useEffect(() => {
    // load districts when governorate changes
    if (!token || !governorateId) return;

    (async () => {
      try {
        setDistrictId("");
        const res = await api.get(`/districts?governorateId=${governorateId}`, { headers });
        setDistricts(res.data);
      } catch (e) {
        Alert.alert("Error", e?.response?.data?.message || "Failed to load districts");
      }
    })();
  }, [governorateId, token]);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Media permission is required to attach images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      // Expo returns result.assets
      setImages(result.assets.map(a => ({ uri: a.uri })));
    }
  };

  const validate = () => {
    if (!governorateId) return "Please select a governorate";
    if (!districtId) return "Please select a district";
    if (!category.trim()) return "Category is required";
    if (!description.trim()) return "Description is required";
    if (!locationDescription.trim()) return "Location description is required";
    if (!coords) return "Location is required";
    if (images.length === 0) return "At least 1 image is required";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Missing info", err);
      return;
    }

    try {
      const form = new FormData();

      form.append("category", category.trim());
      form.append("description", description.trim());
      form.append("governorateId", governorateId);
      form.append("districtId", districtId);
      form.append("locationDescription", locationDescription.trim());
      form.append("lat", String(coords.latitude));
      form.append("lng", String(coords.longitude));

      images.forEach((img, idx) => {
        const uri = img.uri;
        const filename = uri.split("/").pop() || `photo_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match?.[1]?.toLowerCase() || "jpg";

        const mime =
          ext === "png" ? "image/png" :
          ext === "webp" ? "image/webp" :
          "image/jpeg";

        form.append("images", {
          uri,
          name: filename,
          type: mime,
        });
      });

      const res = await api.post("/reports", form, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert("✅ Done", "Report submitted successfully!");
      // reset basic fields (keep location)
      setCategory("");
      setDescription("");
      setLocationDescription("");
      setImages([]);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to submit report");
    }
  };

  // if (!region) {
  //   return (
  //     <View style={{ padding: 16 }}>
  //       <Text>Loading location…</Text>
  //     </View>
  //   );
  // }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Create Report</Text>

      {/* Governorate picker (simple buttons version)
          You can replace this with a real dropdown later. */}
      <Text style={{ fontWeight: "600" }}>Governorate *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {governorates.map(g => (
          <TouchableOpacity
            key={g._id}
            onPress={() => setGovernorateId(g._id)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              marginRight: 8,
              borderWidth: 1,
              opacity: governorateId === g._id ? 1 : 0.7,
            }}
          >
            <Text>{g.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ fontWeight: "600" }}>District *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {districts.map(d => (
          <TouchableOpacity
            key={d._id}
            onPress={() => setDistrictId(d._id)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              marginRight: 8,
              borderWidth: 1,
              opacity: districtId === d._id ? 1 : 0.7,
            }}
          >
            <Text>{d.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ fontWeight: "600" }}>Category *</Text>
      <TextInput
        value={category}
        onChangeText={setCategory}
        placeholder="e.g., Road, Garbage, Streetlight..."
        style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
      />

      <Text style={{ fontWeight: "600" }}>Description *</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the issue"
        multiline
        style={{ borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 80 }}
      />

      <Text style={{ fontWeight: "600" }}>Location description *</Text>
      <TextInput
        value={locationDescription}
        onChangeText={setLocationDescription}
        placeholder="e.g., Near ABC school, main entrance..."
        style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
      />

      <Text style={{ fontWeight: "600" }}>Select exact location *</Text>
      <View style={{ height: 260, borderRadius: 12, overflow: "hidden", borderWidth: 1 }}>
        <MapView
          style={{ flex: 1 }}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setCoords({ latitude, longitude });
          }}
        >
          {coords && (
            <Marker
              coordinate={coords}
              draggable
              onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)}
            />
          )}
        </MapView>
      </View>

      <Text style={{ fontWeight: "600" }}>Images (at least 1) *</Text>
      <TouchableOpacity
        onPress={pickImages}
        style={{ padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" }}
      >
        <Text>Pick Images</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img.uri }}
              style={{ width: 90, height: 90, borderRadius: 10, marginRight: 8 }}
            />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={submit}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", marginTop: 8 }}
      >
        <Text style={{ fontWeight: "700" }}>Submit Report</Text>
      </TouchableOpacity>

      {/* <Text style={{ opacity: 0.7, marginTop: 8 }}>
        Note: If you’re testing on a real phone, your API URL must use your PC IP (not localhost).
      </Text> */}
    </ScrollView>
  );
}
