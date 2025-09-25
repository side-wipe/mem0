from typing import List

import numpy as np
from langchain_core.embeddings import Embeddings
from volcenginesdkarkruntime import Ark, AsyncArk
from memu.utils import get_logger

logger = get_logger(__name__)

class VolcEngineMaasEmbeddingV3(Embeddings):
    """
    火山给langchain 提供了VolcanoEmbeddings 但是没有query instruction，因此还是自己写了下
    """

    def __init__(self, volc_engine_maas_ak: str | None = None, volc_engine_maas_sk: str | None = None,
                 api_key: str | None = None, endpoint_id: str = "", api_base: str | None = None,
                 with_query_instruction: bool = True):
        if not volc_engine_maas_ak and not volc_engine_maas_sk and not api_key:
            raise ValueError("volc_engine_maas_ak and volc_engine_maas_sk or api_key are required")
        self.query_instruction_for_retrieval = self._get_instruction() if with_query_instruction else None
        api_base = api_base if api_base else "https://ark.cn-beijing.volces.com/api/v3"
        self.client = Ark(
            ak=volc_engine_maas_ak,
            sk=volc_engine_maas_sk,
            api_key=api_key,
            base_url=api_base,
            region="cn-beijing"
        )
        self.async_client = AsyncArk(
            ak=volc_engine_maas_ak,
            sk=volc_engine_maas_sk,
            api_key=api_key,
            base_url=api_base,
            region="cn-beijing"
        )
        self.model = endpoint_id

    def embed_documents(
            self, texts: List[str], chunk_size: int | None = 0
    ) -> List[List[float]]:
        """
        可以参考 https://www.volcengine.com/docs/82379/1329508 对输出的emb进行降维
        """
        response = self.client.embeddings.create(input=texts, model=self.model)
        return [emb.embedding for emb in response.data]

    async def aembed_documents(
            self, texts: List[str], chunk_size: int | None = 0
    ) -> List[List[float]]:
        """
        可以参考 https://www.volcengine.com/docs/82379/1329508 对输出的emb进行降维
        """
        response = await self.async_client.embeddings.create(input=texts, model=self.model)
        return [emb.embedding for emb in response.data]

    def embed_query(self, text: str) -> List[float]:
        """Embed query text."""
        if self.query_instruction_for_retrieval:
            text = self.query_instruction_for_retrieval + text
            logger.info(f"expand query {text} for embedding")
        response = self.client.embeddings.create(input=[text], model=self.model)
        return response.data[0].embedding

    async def aembed_query(self, text: str) -> List[float]:
        """Embed query text."""
        if self.query_instruction_for_retrieval:
            text = self.query_instruction_for_retrieval + text
            logger.info(f"expand query {text} for embedding")
        response = await self.async_client.embeddings.create(input=[text], model=self.model)
        return response.data[0].embedding

    def _get_instruction(self):
        """
        参考 https://www.volcengine.com/docs/82379/1329508
        query 建议必须添加如下 instruction 前缀保证检索效果
        """
        return "为这个句子生成表示以用于检索相关文章："


def sliced_norm_l2(vec: List[float], dim=1024) -> List[float]:
    """
    对输入向量降维
    """
    # dim 取值 512,1024,2048
    norm = float(np.linalg.norm(vec[:dim]))
    return [v / norm for v in vec[:dim]]
