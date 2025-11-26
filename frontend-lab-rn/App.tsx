import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  FlatList,
  Image,
  Alert,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

const API_URL = "http://192.168.1.12:3000";

type Place = {
  _id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string | null;
  createdAt?: string;
  lab?: string;
  reportedAt?: string;
};

export default function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lab, setLab] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  // Date / time picker states
  const [reportedAt, setReportedAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState<"date" | "time">("date");

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/places`);
      const data = await res.json();
      setPlaces(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar os registros");
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão negada",
        "É necessário permitir o acesso à localização."
      );
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "É necessário permitir o uso da câmera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const base64Img = `data:image/jpeg;base64,${asset.base64}`;
        setPhoto(base64Img);
      } else if (asset.uri) {
        setPhoto(asset.uri);
      }
    }
  };

  const handleSave = async () => {
    if (
      !title ||
      !description ||
      !lab ||
      latitude == null ||
      longitude == null
    ) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha título, descrição, laboratório e localização."
      );
      return;
    }

    try {
      setLoading(true);

      // Se quiser enviar reportedAt como ISO string (ou null)
      const reportedAtIso = reportedAt ? reportedAt.toISOString() : null;

      const res = await fetch(`${API_URL}/api/places`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          lab,
          reportedAt: reportedAtIso,
          latitude,
          longitude,
          photo,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Erro ao salvar", errorData);
        Alert.alert("Erro", "Falha ao salvar o registro.");
        return;
      }

      const created = await res.json();
      setPlaces((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setLab("");
      setLatitude(null);
      setLongitude(null);
      setPhoto(null);
      setReportedAt(null);
      Alert.alert("Sucesso", "Registro salvo com sucesso!");
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha na conexão com o backend.");
    } finally {
      setLoading(false);
    }
  };

  // ======= NOVAS FUNÇÕES DE DELETE =======

  // Deleta todos os registros (chama DELETE /api/places)
  const deleteAll = () => {
    Alert.alert(
      "Confirmar exclusão",
      "Deseja apagar TODOS os registros? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar tudo",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/api/places`, {
                method: "DELETE",
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("Erro ao deletar todos:", err);
                Alert.alert("Erro", "Falha ao apagar registros.");
                return;
              }
              // atualiza lista local
              setPlaces([]);
              Alert.alert("Sucesso", "Todos os registros foram apagados.");
            } catch (error) {
              console.error(error);
              Alert.alert("Erro", "Falha na comunicação com o backend.");
            }
          },
        },
      ]
    );
  };

  // Deleta um registro individual (chama DELETE /api/places/:id)
  const deleteOne = (id: string) => {
    Alert.alert("Confirmar exclusão", "Deseja apagar este registro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/places/${id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              console.error("Erro ao deletar:", err);
              Alert.alert("Erro", "Falha ao apagar o registro.");
              return;
            }
            // remove localmente sem refetch
            setPlaces((prev) => prev.filter((p) => p._id !== id));
            Alert.alert("Sucesso", "Registro apagado.");
          } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Falha na comunicação com o backend.");
          }
        },
      },
    ]);
  };

  // ======= /NOVAS FUNÇÕES DE DELETE =======

  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    // @ts-ignore - event.type exists, mas types podem variar
    if (event.type === "dismissed") return;
    if (selected) {
      if (!reportedAt) {
        setReportedAt(selected);
      } else {
        if (dateMode === "time") {
          const d = new Date(reportedAt);
          d.setHours(selected.getHours());
          d.setMinutes(selected.getMinutes());
          setReportedAt(d);
        } else {
          const prev = reportedAt ? new Date(reportedAt) : new Date();
          const d = new Date(selected);
          d.setHours(prev.getHours(), prev.getMinutes(), prev.getSeconds());
          setReportedAt(d);
        }
      }
    }
  };

  const showPicker = (mode: "date" | "time") => {
    setDateMode(mode);
    setShowDatePicker(true);
  };

  const renderItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => deleteOne(item._id)} // apagar com long press
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <Text style={styles.cardCoords}>
          Lat: {item.latitude?.toFixed(5)} | Lng: {item.longitude?.toFixed(5)}
        </Text>
        {item.lab ? (
          <Text style={styles.cardLab}>Laboratório: {item.lab}</Text>
        ) : null}
        {item.reportedAt ? (
          <Text style={styles.cardDate}>
            Data do defeito: {new Date(item.reportedAt).toLocaleString()}
          </Text>
        ) : null}
        {item.createdAt ? (
          <Text style={styles.cardDate}>
            Registrado em: {new Date(item.createdAt).toLocaleString()}
          </Text>
        ) : null}
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.cardImage} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.title}>Relatar Equipamento Defeituoso</Text>

        <TextInput
          style={styles.input}
          placeholder="Título"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descrição (o que aconteceu)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Laboratório / Setor"
          value={lab}
          onChangeText={setLab}
        />

        <View style={styles.row}>
          <Button title="Obter Localização" onPress={getLocation} />
        </View>
        <Text style={styles.coordsText}>Latitude: {latitude ?? "-"}</Text>
        <Text style={styles.coordsText}>Longitude: {longitude ?? "-"}</Text>

        <View style={styles.row}>
          <Button title="Tirar Foto" onPress={takePhoto} />
        </View>
        {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}

        <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
          <View style={{ flex: 1 }}>
            <Button title="Escolher Data" onPress={() => showPicker("date")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Escolher Hora" onPress={() => showPicker("time")} />
          </View>
        </View>
        <Text>
          Data/Hora do defeito:{" "}
          {reportedAt
            ? reportedAt.toLocaleString()
            : "Não definida (usará hora do servidor)"}
        </Text>

        {showDatePicker && (
          <DateTimePicker
            value={reportedAt instanceof Date ? reportedAt : new Date()}
            mode={dateMode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeDate}
          />
        )}

        <View style={styles.row}>
          <Button
            title={loading ? "Salvando..." : "Salvar"}
            onPress={handleSave}
            disabled={loading}
          />
        </View>

        {/* Botão para apagar todos os registros */}
        <View style={{ marginVertical: 8 }}>
          <Button
            title="Apagar todos os registros"
            onPress={deleteAll}
            color="#d9534f"
          />
        </View>
      </ScrollView>

      <Text style={styles.listTitle}>Registros Cadastrados</Text>
      <FlatList
        data={places}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 40 },
  form: { paddingHorizontal: 16, paddingBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { marginVertical: 8 },
  coordsText: { fontSize: 14, marginBottom: 2 },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  cardDescription: { fontSize: 14, marginBottom: 4 },
  cardCoords: { fontSize: 12, color: "#555", marginBottom: 4 },
  cardLab: { fontSize: 12, color: "#333", fontWeight: "600", marginBottom: 4 },
  cardImage: { width: "100%", height: 180, borderRadius: 8, marginTop: 4 },
  cardDate: { fontSize: 11, color: "#777", marginTop: 4 },
});
