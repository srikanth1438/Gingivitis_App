import { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';

export default function ForgotPasswordScreen({ navigation }: any) {
    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = 'Gingivitis Detector - Forgot Password';
        }
    }, []);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSendOtp = async () => {
        setErrorMsg('');
        if (!email) {
            setErrorMsg('Please enter your email!');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                navigation.navigate('ResetPassword', { email });
            } else {
                setErrorMsg(data.detail || 'Failed to send OTP!');
            }
        } catch (error) {
            setErrorMsg('Could not connect to server!');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔑 Forgot Password</Text>
            <Text style={styles.subtitle}>
                Enter your registered email address{'\n'}
                and we will send you an OTP
            </Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                testID="forgot-email"
                accessibilityLabel="forgot-email"
                id="email"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
            ) : (
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSendOtp}
                    testID="forgot-send-otp-button"
                    accessibilityLabel="forgot-send-otp-button"
                    id="send-otp-button"
                >
                    <Text style={styles.buttonText}>Send OTP</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigation.replace('Login')}>
                <Text style={styles.linkText}>← Back to Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
    input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    linkText: { color: '#4A90E2', marginTop: 20, fontSize: 14 },
    errorText: { color: '#E74C3C', marginBottom: 15, textAlign: 'center', fontSize: 14 },
});