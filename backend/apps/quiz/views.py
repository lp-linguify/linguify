from rest_framework import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from .models import QuizQuestion
from .serializers import QuizQuestionSerializer
import random

class QuizPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 1000



class QuizQuestionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lesson_id = request.query_params.get('lesson_id')
        questions = QuizQuestion.objects.all()

        if lesson_id:
            questions = questions.filter(lesson__id=lesson_id)

        questions = list(questions)
        random.shuffle(questions)
        questions = questions[:5]

        if not questions:
            return Response({"detail": "Aucune question disponible."}, status=404)

        serializer = QuizQuestionSerializer(questions, many=True)
        return Response(serializer.data)