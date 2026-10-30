import { IMAGE_SPECS, type ImageKind } from "./imageResize";
import type { InfoTipContent } from "../components/InfoTip";

const IMAGE_USE: Record<ImageKind, string> = {
  avatar: "Foto redonda ao lado do nome.",
  cover: "Banner no topo da página (capa do modelo Palco).",
  logo: "Substitui o nome escrito no topo.",
  background: "Fica atrás da página inteira.",
  "section-bg": "Fica atrás desta seção.",
  gallery: "Fotos da galeria, em grade, mosaico ou faixa.",
};

/** What to send for an image slot: ideal size, shape, format, weight. */
export function imageHelp(kind: ImageKind): InfoTipContent {
  const spec = IMAGE_SPECS[kind];
  const ratio = kind === "avatar" ? "quadrada (1:1)" : kind === "cover" ? "horizontal (16:9)" : kind === "logo" ? "horizontal, fundo transparente" : "livre";
  const size =
    spec.fit === "cover"
      ? `Tamanho ideal: ${spec.width}×${spec.height} px. Maiores são cortadas no centro; menores ficam no tamanho enviado.`
      : `Até ${spec.width}×${spec.height} px. Maiores são reduzidas, sem corte.`;
  return {
    title: IMAGE_USE[kind],
    lines: [
      `Proporção: ${ratio}.`,
      size,
      `Formatos: JPG, PNG ou WebP${kind === "logo" ? " (PNG ou WebP para manter a transparência)" : ""}, até 10 MB.`,
      "Ao enviar, você enquadra a foto (arrastar, zoom, girar) e vê como fica antes de confirmar.",
    ],
  };
}

export const FIELD_HELP = {
  template: { title: "Modelo da página", lines: ["Define a estrutura: topo, espaçamentos e cards.", "Trocar de modelo mantém todo o conteúdo e as cores."] },
  colors: { title: "Cores", lines: ["Fundo, texto e destaque (botões e links).", "Tons de cinza e bordas são derivados automaticamente do texto.", "Com uma capa enviada, dá para puxar a paleta da imagem."] },
  fonts: { title: "Fontes", lines: ["Uma fonte para títulos e outra para o texto.", "“Igual ao texto” usa a mesma nos dois."] },
  buttons: { title: "Botões", lines: ["Cantos dos botões e dos cards: retos, arredondados ou pílula."] },
  background: { title: "Fundo da página", lines: ["Imagem, gradiente ou textura atrás de tudo.", "Escurecimento (0–90%) e desfoque (0–20 px) deixam o texto legível.", "“Fixo” mantém a imagem parada enquanto a página rola."] },
  identity: { title: "Identidade", lines: ["Capa 1600×900 px, foto de perfil 800×800 px e logo até 1200×400 px.", "Vídeo no topo: link do YouTube ou Vimeo, toca mudo e em loop no lugar da capa."] },
  heroVideo: { title: "Vídeo no topo", lines: ["Cole o link de um vídeo do YouTube ou Vimeo (público ou não listado).", "Toca sem som, em loop, no lugar da capa.", "Em conexões lentas a capa aparece primeiro."] },
  conversion: { title: "Contato rápido", lines: ["WhatsApp: botão flutuante e “Falar no WhatsApp” no topo.", "Links rápidos: até 8 ícones abaixo do nome (Instagram, Spotify, etc.)."] },
  whatsapp: { title: "Número do WhatsApp", lines: ["Só dígitos, com DDI e DDD. Ex.: 5511999998888.", "Abre a conversa já com a mensagem pronta, se houver."] },
  whatsappMessage: { title: "Mensagem pronta", lines: ["Texto que já aparece digitado quando alguém clica no botão.", "Até 300 caracteres."] },
  quickLinks: { title: "Links rápidos", lines: ["Até 8 links com ícone (Instagram, Spotify, YouTube, TikTok, site…).", "O ícone é escolhido pelo endereço; o rótulo é opcional (até 30 caracteres).", "Cliques são contados em “Quem abriu”."] },
  site: { title: "Site", lines: ["Nome na página: até 80 caracteres (vazio = nome da conta).", "Frase abaixo do nome: até 140 caracteres.", "Abas mostram uma seção por vez; rolagem mostra tudo com menu fixo."] },
  displayName: { title: "Nome na página", lines: ["Nome artístico mostrado no topo e na aba do navegador.", "Até 80 caracteres. Vazio usa o nome da conta."] },
  tagline: { title: "Frase abaixo do nome", lines: ["Um resumo de uma linha: estilo, cidade, o que faz.", "Até 140 caracteres."] },
  sections: { title: "Seções da página", lines: ["Ordem, nome e visibilidade de cada parte.", "O pincel abre o estilo da seção: fundo, cores, largura, espaçamento.", "Remover uma seção não apaga fotos, mídias ou datas."] },
  sectionBackground: { title: "Fundo da seção", lines: ["Até 1920×1920 px, JPG/PNG/WebP, até 10 MB.", "Escurecimento controla a legibilidade do texto sobre a imagem.", "Ao enviar, você enquadra a imagem em 16:9 e confirma."] },
  languages: { title: "Idiomas", lines: ["Ligue o inglês para oferecer a página em PT e EN.", "Traduza título e textos de cada seção; o que ficar vazio usa o português."] },
  domain: { title: "Domínio próprio", lines: ["Sem domínio? Seu presskit já abre em nome.presskitai.com.br, de graça.", "Ou use um domínio seu no lugar de presskitai.com.br/nome.", "Crie um CNAME no DNS apontando para o endereço indicado.", "Depois de apontar, a ativação é feita pela equipe (até 1 dia útil)."] },
  bioShort: { title: "Bio curta", lines: ["Até 280 caracteres. Aparece no topo da seção e na prévia do link (WhatsApp, Instagram).", "Uma ou duas frases: quem é, estilo, de onde."] },
  bioLong: { title: "Bio completa", lines: ["Até 4000 caracteres. Quebras de linha viram parágrafos.", "Conte a trajetória, destaques e o que o contratante leva."] },
  music: { title: "Músicas e sets", lines: ["Cole links do Spotify (faixa, álbum, playlist) ou SoundCloud.", "Cada link vira um player na página."] },
  video: { title: "Vídeos", lines: ["Cole links do YouTube ou Vimeo (vídeo público ou não listado).", "Cada link vira um player embutido."] },
  gallery: { title: "Fotos", lines: ["Até 2000 px no lado maior, JPG/PNG/WebP, até 10 MB cada.", "Plano grátis: 6 fotos. PRO: 40 (artista visual: +20).", "Ao enviar, você escolhe o enquadramento: original, 1:1, 4:5 ou 16:9."] },
  tourDates: { title: "Agenda", lines: ["Data, cidade, casa e link de ingressos.", "Datas passadas saem da página sozinhas."] },
  contactEmail: { title: "E-mail de contato", lines: ["Para onde vai o botão “Contratar para um evento”.", "Use um e-mail que você lê todo dia."] },
  contactPhone: { title: "Telefone", lines: ["Opcional. Aparece como link para ligar.", "Para WhatsApp, use o campo em Personalizar → Contato rápido."] },
  socialLinks: { title: "Redes sociais", lines: ["Perfis completos (https://…).", "Aparecem como ícones na seção Contato."] },
  press: { title: "Imprensa", lines: ["Destaque: uma frase forte com a fonte (até 500 caracteres).", "Menções: veículo, link e trecho citado (até 400 caracteres)."] },
  rider: { title: "Rider técnico", lines: ["Texto livre até 6000 caracteres.", "PDF opcional, até 50 MB — vira o botão “Baixar rider técnico” no topo."] },
  riderPdf: { title: "PDF do rider", lines: ["Só PDF, até 50 MB.", "Aparece como botão de download no topo e na seção."] },
  downloads: { title: "Downloads", lines: ["Arquivos: PDF, ZIP, DOCX, PPTX, MP3 ou imagem, até 50 MB cada.", "Ou um link externo (Drive, WeTransfer).", "Até 12 itens; nome até 80 caracteres."] },
  stats: { title: "Números", lines: ["Até 6 itens: número (até 20 caracteres) + descrição (até 40).", "Ex.: 120k · ouvintes mensais."] },
  testimonials: { title: "Depoimentos", lines: ["Até 8 itens: quem disse, cargo/veículo (opcional) e o depoimento (até 500 caracteres)."] },
  faq: { title: "Perguntas frequentes", lines: ["Até 12 perguntas (160 caracteres) com resposta (1500 caracteres).", "Abrem e fecham na página."] },
  custom: { title: "Texto livre", lines: ["Até 4000 caracteres. Quebras de linha viram parágrafos."] },
  sectionTitle: { title: "Título da seção", lines: ["Como a seção aparece na página e no menu.", "Até 60 caracteres. Vazio usa o nome padrão."] },
  roster: { title: "Artistas", lines: ["Cada artista tem uma página própria, editada pelo mesmo painel.", "Só artistas publicados aparecem na página da produtora."] },
} satisfies Record<string, InfoTipContent>;
