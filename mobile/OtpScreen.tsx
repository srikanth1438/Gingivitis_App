import { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';

export default function OtpScreen({ route, navigation }: any) {
    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = 'Gingivitis Detector - Verify OTP';
        }
    }, []);
    const { username, email, password } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleVerifyOtp = async () => {
        setErrorMsg('');
        if (!otp) {
            setErrorMsg('Please enter the OTP!');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8000/verify-otp?otp_code=${otp}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                }
            );
            const data = await response.json();
            if (response.ok) {
                setSuccessMsg('Account created! Redirecting to login...');
                setTimeout(() => {
                    navigation.replace('Login');
                }, 2000);
            } else {
                setErrorMsg(data.detail || 'Invalid OTP!');
            }
        } catch (error) {
            setErrorMsg('Could not connect to server!');
        }
        setLoading(false);
    };

    const handleResendOtp = async () => {
        setErrorMsg('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessMsg('OTP resent to your email!');
            } else {
                setErrorMsg(data.detail || 'Failed to resend OTP!');
            }
        } catch (error) {
            setErrorMsg('Could not connect to server!');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔐 Verify Email</Text>
            <Text style={styles.subtitle}>
                Enter the 6-digit OTP sent to{'\n'}
                <Text style={styles.email}>{email}</Text>
            </Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                testID="otp-code"
                accessibilityLabel="otp-code"
                id="otp"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleVerifyOtp}
                        testID="verify-otp-button"
                        accessibilityLabel="verify-otp-button"
                        id="verify-otp-button"
                    >
                        <Text style={styles.buttonText}>Verify OTP</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleResendOtp}
                        testID="resend-otp-button"
                        accessibilityLabel="resend-otp-button"
                        id="resend-otp-button"
                    >
                        <Text style={styles.resendText}>Resend OTP</Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity onPress={() => navigation.replace('Register')}>
                <Text style={styles.linkText}>← Back to Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
    email: { fontWeight: 'bold', color: '#4A90E2' },
    otpInput: { width: '70%', borderWidth: 2, borderColor: '#4A90E2', borderRadius: 10, padding: 15, fontSize: 24, marginBottom: 20, letterSpacing: 10 },
    button: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
    resendButton: { backgroundColor: '#fff', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#4A90E2' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resendText: { color: '#4A90E2', fontSize: 16, fontWeight: 'bold' },
    linkText: { color: '#4A90E2', marginTop: 20, fontSize: 14 },
    errorText: { color: '#E74C3C', marginBottom: 15, textAlign: 'center', fontSize: 14 },
    successText: { color: '#27AE60', marginBottom: 15, textAlign: 'center', fontSize: 14 },
});
