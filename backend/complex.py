import numpy as np
from typing import Union

class Complex:
    """
    Complex number implementation for quantum simulations using numpy
    """
    def __init__(self, real: float = 0.0, imag: float = 0.0):
        self.value = np.complex128(complex(real, imag))

    @property
    def real(self) -> float:
        return self.value.real

    @property
    def imag(self) -> float:
        return self.value.imag

    @staticmethod
    def from_polar(magnitude: float, phase: float) -> 'Complex':
        c = Complex()
        c.value = np.complex128(magnitude * np.cos(phase) + 1j * magnitude * np.sin(phase))
        return c

    def add(self, other: 'Complex') -> 'Complex':
        c = Complex()
        c.value = self.value + other.value
        return c

    def subtract(self, other: 'Complex') -> 'Complex':
        c = Complex()
        c.value = self.value - other.value
        return c

    def multiply(self, other: 'Complex') -> 'Complex':
        c = Complex()
        c.value = self.value * other.value
        return c

    def multiply_scalar(self, scalar: float) -> 'Complex':
        c = Complex()
        c.value = self.value * scalar
        return c

    def conjugate(self) -> 'Complex':
        c = Complex()
        c.value = np.conj(self.value)
        return c

    def magnitude(self) -> float:
        return np.abs(self.value)

    def magnitude_squared(self) -> float:
        return np.real(self.value * np.conj(self.value))

    def phase(self) -> float:
        return np.angle(self.value)

    def __str__(self) -> str:
        return str(self.value)

    def clone(self) -> 'Complex':
        c = Complex()
        c.value = self.value
        return c

    # For numpy compatibility
    def __complex__(self):
        return complex(self.value)

    def __add__(self, other):
        if isinstance(other, Complex):
            return self.add(other)
        return Complex(self.real + other, self.imag)

    def __mul__(self, other):
        if isinstance(other, Complex):
            return self.multiply(other)
        return Complex(self.real * other, self.imag * other)