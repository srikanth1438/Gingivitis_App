import { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    Image, ActivityIndicator, ScrollView, Alert, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface DetectionResult {
    has_gingivitis: boolean;
    message: string;
    detections: Array<{ label: string; confidence: number }>;
    is_valid: boolean;
}

export default function HomeScreen({ navigation }: any) {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<DetectionResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = 'Gingivitis Detector - Dashboard';
        }
    }, []);

    const handleLogout = () => {
    if (typeof document !== 'undefined') {
        // Web: use browser confirm
        const confirmed = window.confirm('Are you sure you want to logout?');
        if (confirmed) {
            navigation.replace('Login');
        }
    } else {
        // Mobile: use Alert
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => navigation.replace('Login'),
                },
            ]
        );
    }
};

    const pickImage = async () => {
        if (typeof document !== 'undefined') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    const uri = URL.createObjectURL(file);
                    setImage(uri);
                    setResult(null);
                }
            };
            input.click();
        } else {
            let picked = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });
            if (!picked.canceled) {
                setImage(picked.assets[0].uri);
                setResult(null);
            }
        }
    };

    const analyzeImage = async () => {
        if (!image) {
            Alert.alert('Please select an image first!');
            return;
        }
        setLoading(true);
        try {
            let formData = new FormData();

            if (typeof document !== 'undefined') {
                const response = await fetch(image);
                const blob = await response.blob();
                formData.append('file', blob, 'tooth.jpg');
            } else {
                formData.append('file', {
                    uri: image,
                    type: 'image/jpeg',
                    name: 'tooth.jpg',
                } as any);
            }

            const response = await fetch('http://localhost:8000/detect', {
                method: 'POST',
                body: formData,
            });
            const data: DetectionResult = await response.json();
            if (!data.is_valid) {
                Alert.alert('Invalid Image!', 'No teeth detected! Please upload a clear tooth image.');
                setLoading(false);
                setImage(null);
                return;
            }
            setResult(data);
        } catch (error) {
            Alert.alert('Error', 'Could not connect to server!');
        }
        setLoading(false);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🦷 Gingivitis Detector</Text>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    testID="logout-button"
                    accessibilityLabel="logout-button"
                    id="logout-button"
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Upload a tooth image to check for inflammation</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={pickImage}
                testID="select-image-button"
                accessibilityLabel="select-image-button"
                id="select-image-button"
            >
                <Text style={styles.buttonText}>📷 Select Tooth Image</Text>
            </TouchableOpacity>

            {image && <Image source={{ uri: image }} style={styles.image} />}

            {image && (
                <TouchableOpacity
                    style={styles.analyzeButton}
                    onPress={analyzeImage}
                    testID="analyze-button"
                    accessibilityLabel="analyze-button"
                    id="analyze-button"
                >
                    <Text style={styles.buttonText}>🔍 Analyze Image</Text>
                </TouchableOpacity>
            )}

            {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

            {result && (
                <View style={[styles.resultBox,
                { backgroundColor: result.has_gingivitis ? '#ffe0e0' : '#e0ffe0' }]}>
                    <Text style={styles.resultTitle}>
                        {result.has_gingivitis ? '⚠️ Gingivitis Detected!' : '✅ Teeth Look Healthy!'}
                    </Text>
                    <Text style={styles.resultMessage}>{result.message}</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 50, marginBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
    button: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, width: '80%', alignItems: 'center', marginBottom: 20 },
    analyzeButton: { backgroundColor: '#27AE60', padding: 15, borderRadius: 10, width: '80%', alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    image: { width: 300, height: 300, borderRadius: 10, marginTop: 10 },
    resultBox: { marginTop: 20, padding: 20, borderRadius: 10, width: '90%', alignItems: 'center' },
    resultTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    resultMessage: { fontSize: 14, textAlign: 'center', color: '#333' },
    logoutButton: { backgroundColor: '#E74C3C', padding: 8, borderRadius: 8 },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});