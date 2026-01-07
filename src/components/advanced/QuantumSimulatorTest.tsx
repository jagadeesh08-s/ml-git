import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { simulateCircuit, EXAMPLE_CIRCUITS, GATES } from '@/utils/quantumSimulation';

const QuantumSimulatorTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    const results: any[] = [];

    // Test 1: Basic |0⟩ state
    console.log('🧪 Test 1: |0⟩ state');
    const test1 = simulateCircuit({ numQubits: 1, gates: [] });
    const test1Result = {
      name: '|0⟩ state',
      probabilities: test1.probabilities,
      blochVector: test1.reducedStates[0]?.blochVector,
      expected: [0, 0, 1],
      passed: nearlyEqual(test1.reducedStates[0]?.blochVector.x, 0) &&
              nearlyEqual(test1.reducedStates[0]?.blochVector.y, 0) &&
              nearlyEqual(test1.reducedStates[0]?.blochVector.z, 1)
    };
    results.push(test1Result);
    console.log('Result:', test1Result);

    // Test 2: X gate on |0⟩
    console.log('🧪 Test 2: X|0⟩');
    const test2 = simulateCircuit({ numQubits: 1, gates: [{ name: 'X', qubits: [0] }] });
    const test2Result = {
      name: 'X|0⟩',
      probabilities: test2.probabilities,
      blochVector: test2.reducedStates[0]?.blochVector,
      expected: [0, 0, -1],
      passed: nearlyEqual(test2.reducedStates[0]?.blochVector.x, 0) &&
              nearlyEqual(test2.reducedStates[0]?.blochVector.y, 0) &&
              nearlyEqual(test2.reducedStates[0]?.blochVector.z, -1)
    };
    results.push(test2Result);
    console.log('Result:', test2Result);

    // Test 3: H gate on |0⟩
    console.log('🧪 Test 3: H|0⟩');
    const test3 = simulateCircuit({ numQubits: 1, gates: [{ name: 'H', qubits: [0] }] });
    const test3Result = {
      name: 'H|0⟩',
      probabilities: test3.probabilities,
      blochVector: test3.reducedStates[0]?.blochVector,
      expected: [1, 0, 0],
      passed: nearlyEqual(test3.reducedStates[0]?.blochVector.x, 1) &&
              nearlyEqual(test3.reducedStates[0]?.blochVector.y, 0) &&
              nearlyEqual(test3.reducedStates[0]?.blochVector.z, 0)
    };
    results.push(test3Result);
    console.log('Result:', test3Result);

    // Test 4: RX gate with parameter
    console.log('🧪 Test 4: RX(π/2)|0⟩');
    const test4 = simulateCircuit({
      numQubits: 1,
      gates: [{ name: 'RX', qubits: [0], parameters: { angle: Math.PI / 2 } }]
    });
    const test4Result = {
      name: 'RX(π/2)|0⟩',
      probabilities: test4.probabilities,
      blochVector: test4.reducedStates[0]?.blochVector,
      expected: [0, -1, 0],
      passed: nearlyEqual(test4.reducedStates[0]?.blochVector.x, 0) &&
              nearlyEqual(test4.reducedStates[0]?.blochVector.y, -1) &&
              nearlyEqual(test4.reducedStates[0]?.blochVector.z, 0)
    };
    results.push(test4Result);
    console.log('Result:', test4Result);

    // Test 5: RY gate with parameter
    console.log('🧪 Test 5: RY(π/2)|0⟩');
    const test5 = simulateCircuit({
      numQubits: 1,
      gates: [{ name: 'RY', qubits: [0], parameters: { angle: Math.PI / 2 } }]
    });
    const test5Result = {
      name: 'RY(π/2)|0⟩',
      probabilities: test5.probabilities,
      blochVector: test5.reducedStates[0]?.blochVector,
      expected: [1, 0, 0],
      passed: nearlyEqual(test5.reducedStates[0]?.blochVector.x, 1) &&
              nearlyEqual(test5.reducedStates[0]?.blochVector.y, 0) &&
              nearlyEqual(test5.reducedStates[0]?.blochVector.z, 0)
    };
    results.push(test5Result);
    console.log('Result:', test5Result);

    // Test 6: Bell state
    console.log('🧪 Test 6: Bell state');
    const test6 = simulateCircuit(EXAMPLE_CIRCUITS['Bell State']);
    const test6Result = {
      name: 'Bell state',
      probabilities: test6.probabilities,
      qubit0Bloch: test6.reducedStates[0]?.blochVector,
      qubit1Bloch: test6.reducedStates[1]?.blochVector,
      expected: 'Both qubits maximally mixed [0,0,0]',
      passed: nearlyEqual(test6.reducedStates[0]?.blochVector.x, 0) &&
              nearlyEqual(test6.reducedStates[0]?.blochVector.y, 0) &&
              nearlyEqual(test6.reducedStates[0]?.blochVector.z, 0) &&
              nearlyEqual(test6.reducedStates[1]?.blochVector.x, 0) &&
              nearlyEqual(test6.reducedStates[1]?.blochVector.y, 0) &&
              nearlyEqual(test6.reducedStates[1]?.blochVector.z, 0)
    };
    results.push(test6Result);
    console.log('Result:', test6Result);

    // Test 7: Multiple parameterized gates
    console.log('🧪 Test 7: Multiple parameterized gates');
    const test7 = simulateCircuit({
      numQubits: 2,
      gates: [
        { name: 'RX', qubits: [0], parameters: { angle: Math.PI / 4 } },
        { name: 'RY', qubits: [1], parameters: { angle: Math.PI / 3 } },
        { name: 'CNOT', qubits: [0, 1] }
      ]
    });
    const test7Result = {
      name: 'RX(π/4) ⊗ RY(π/3) + CNOT',
      probabilities: test7.probabilities,
      qubit0Bloch: test7.reducedStates[0]?.blochVector,
      qubit1Bloch: test7.reducedStates[1]?.blochVector,
      expected: 'Complex entangled state',
      passed: test7.probabilities && test7.probabilities.length === 4 // Should have 4 probability amplitudes
    };
    results.push(test7Result);
    console.log('Result:', test7Result);

    // Test 8: Parameter validation
    console.log('🧪 Test 8: Parameter validation');
    let test8Passed = false;
    try {
      const test8 = simulateCircuit({
        numQubits: 1,
        gates: [{ name: 'RX', qubits: [0], parameters: { angle: 'invalid' } }]
      });
      test8Passed = false; // Should have thrown an error
    } catch (error) {
      test8Passed = true; // Correctly caught error
    }
    const test8Result = {
      name: 'Parameter validation',
      expected: 'Should handle invalid parameters gracefully',
      passed: test8Passed
    };
    results.push(test8Result);
    console.log('Result:', test8Result);

    setTestResults(results);
    setIsRunning(false);
    console.log('✅ All tests completed!');
  };

  const nearlyEqual = (a: number, b: number, tol = 1e-2) => Math.abs(a - b) <= tol;

  const passedTests = testResults.filter(test => test.passed).length;
  const totalTests = testResults.length;

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full" />
          Quantum Simulator Tests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-accent hover:bg-accent/80"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          {totalTests > 0 && (
            <Badge variant={passedTests === totalTests ? "default" : "destructive"}>
              {passedTests}/{totalTests} Passed
            </Badge>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <Card key={index} className={`border ${test.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{test.name}</h4>
                    <Badge variant={test.passed ? "default" : "destructive"}>
                      {test.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>

                  {test.probabilities && (
                    <div className="mb-2">
                      <strong className="text-xs">Probabilities:</strong>
                      <div className="text-xs font-mono">
                        {test.probabilities.map((p: number, i: number) =>
                          `|${i.toString(2).padStart(Math.log2(test.probabilities.length), '0')}⟩: ${(p * 100).toFixed(1)}%`
                        ).join(', ')}
                      </div>
                    </div>
                  )}

                  {test.blochVector && (
                    <div className="mb-2">
                      <strong className="text-xs">Bloch Vector:</strong>
                      <div className="text-xs font-mono">
                        [{test.blochVector.x?.toFixed(3)}, {test.blochVector.y?.toFixed(3)}, {test.blochVector.z?.toFixed(3)}]
                      </div>
                    </div>
                  )}

                  {test.qubit0Bloch && test.qubit1Bloch && (
                    <div className="mb-2">
                      <strong className="text-xs">Qubit 0 Bloch:</strong>
                      <div className="text-xs font-mono">
                        [{test.qubit0Bloch.x?.toFixed(3)}, {test.qubit0Bloch.y?.toFixed(3)}, {test.qubit0Bloch.z?.toFixed(3)}]
                      </div>
                      <strong className="text-xs">Qubit 1 Bloch:</strong>
                      <div className="text-xs font-mono">
                        [{test.qubit1Bloch.x?.toFixed(3)}, {test.qubit1Bloch.y?.toFixed(3)}, {test.qubit1Bloch.z?.toFixed(3)}]
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Expected: {Array.isArray(test.expected) ? `[${test.expected.join(', ')}]` : test.expected}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuantumSimulatorTest;
