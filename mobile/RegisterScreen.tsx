import { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';

export default function RegisterScreen({ navigation }: any) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = 'Gingivitis Detector - Register';
        }
    }, []);

    const handleRegister = async () => {
        setErrorMsg('');
        if (!username || !email || !password) {
            setErrorMsg('Please fill in all fields!');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                navigation.navigate('Otp', { username, email, password });
            } else {
                setErrorMsg(data.detail || 'Registration failed!');
            }
        } catch (error) {
            setErrorMsg('Could not connect to server!');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🦷 Gingivitis Detector</Text>
            <Text style={styles.subtitle}>Create a new account</Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                testID="register-username"
                accessibilityLabel="register-username"
                id="username"
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                testID="register-email"
                accessibilityLabel="register-email"
                id="email"
                type="email"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                testID="register-password"
                accessibilityLabel="register-password"
                id="password"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#27AE60" style={{ marginTop: 20 }} />
            ) : (
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRegister}
                    testID="register-button"
                    accessibilityLabel="register-button"
                    id="register-button"
                >
                    <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                accessibilityLabel="go-login-link"
                id="go-login-link"
            >
                <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 30 },
    input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#27AE60', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    linkText: { color: '#4A90E2', marginTop: 20, fontSize: 14 },
    errorText: { color: '#E74C3C', marginBottom: 15, textAlign: 'center', fontSize: 14 },
});
